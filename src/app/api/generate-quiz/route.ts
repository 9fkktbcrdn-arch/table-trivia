import Anthropic, {
  APIError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { OFFLINE_DEMO_QUESTIONS_RAW } from "@/lib/offline-demo-quiz";
import { recordUsageEvent } from "@/lib/usage-server";
import type { GenerateQuizPayload, QuestionDifficulty, QuizQuestion, TriviaDifficulty } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Tried in order until one works. Sonnet first — Opus often 404s or is blocked on newer API keys.
 * Override with ANTHROPIC_QUIZ_MODEL (single id) to force a model; fallbacks still run if it fails.
 */
const MODEL_FALLBACKS = [
  "claude-sonnet-4-6",
  "claude-sonnet-4-20250514",
  "claude-3-5-sonnet-20241022",
] as const;

const MODEL_PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
};

function modelCandidates(): string[] {
  const preferred = process.env.ANTHROPIC_QUIZ_MODEL?.trim();
  const list = preferred ? [preferred, ...MODEL_FALLBACKS] : [...MODEL_FALLBACKS];
  return [...new Set(list)];
}

function difficultyGuidance(d: TriviaDifficulty): string {
  switch (d) {
    case "noob":
      return `Difficulty profile: NOOB (overall easy). Use a blend of 6 easy, 3 medium, 1 hard question. Suitable for kids about ages 6–10: one clearly correct fact, no trick wording, no “all of the above,” no negatives like “which is NOT…”.`;
    case "normal":
      return `Difficulty profile: NORMAL (overall medium). Use a blend of 3 easy, 4 medium, 3 hard questions. One unambiguous correct answer; plausible wrong answers in the same category (e.g. same sport, same era). Avoid trick phrasing unless the fact itself is the challenge.`;
    case "grandmaster":
      return `Difficulty profile: GRANDMASTER (overall hard). Use a blend of 1 easy, 3 medium, 6 hard questions. Deep-cut, specific knowledge for a devoted fan—still one objectively correct answer, no deliberate ambiguity or “two could work” unless you rewrite the stem to rule one out.`;
    default:
      return "";
  }
}

function extraCreditDifficultyGuidance(d: TriviaDifficulty): string {
  switch (d) {
    case "noob":
      return `EXTRA CREDIT profile (still family-friendly but tougher than a normal round): blend 3 easy, 4 medium, 3 hard.`;
    case "normal":
      return `EXTRA CREDIT profile (harder than normal): blend 1 easy, 3 medium, 6 hard.`;
    case "grandmaster":
      return `EXTRA CREDIT profile (maximum challenge): blend 0 easy, 2 medium, 8 hard.`;
    default:
      return "";
  }
}

function isExtraCreditTopic(topic: string): boolean {
  return topic.trim().toLowerCase() === "extra credit";
}

function buildUserPrompt(
  topic: string,
  difficulty: TriviaDifficulty,
  sessionTopics: string[] | undefined,
  gameSeed: string | undefined,
): string {
  const trimmed = topic.trim();
  const extra = isExtraCreditTopic(trimmed);
  const topicLine = extra
    ? sessionTopics && sessionTopics.length > 0
      ? `Round: EXTRA CREDIT (final challenge).
The player completed topic rounds for: ${sessionTopics.map((t) => `"${t.trim()}"`).join(", ")}.

Choose ONE random topic that is clearly unrelated to those completed topics and build all 10 questions around that one random topic.
- Do NOT connect questions to the completed topics.
- Do NOT use a synthesis/crossover format.
- Keep the random topic coherent so the round feels like a standalone category.`
      : `Round: EXTRA CREDIT (final challenge).
Choose ONE random standalone topic and build all 10 questions around it.
- Do NOT use synthesis/crossover questions.
- Keep the random topic coherent across all 10 questions.`
    : `Topic: "${trimmed}". All questions must be clearly about this topic.`;

  const guidance = extra ? extraCreditDifficultyGuidance(difficulty) : difficultyGuidance(difficulty);

  return `${topicLine}

Game seed: "${gameSeed ?? "none"}"
Treat this seed as a randomization key and produce a materially different set of questions for different seeds, even when topic/difficulty are the same.

${guidance}

Generate exactly 10 multiple-choice trivia questions.

Quality (do this before you output):
- Prefer facts you are confident about; avoid precise dates/statistics unless standard textbook knowledge.
- Stem must be a complete question or clear fill-in; no broken grammar.
- All four answers short, parallel in form (e.g. all proper nouns, or all numbers), similar length when possible.
- The four answers must be distinct strings (no duplicates).
- Wrong answers must be plausible but definitively incorrect for the stem you wrote.
- Include a "questionDifficulty" field for each item with value "easy" | "medium" | "hard".
- Include an "explanation" string (1–3 short sentences) that states the fact or reasoning proving the answer at "correctIndex" is the right one—no hedging, no revealing other options by name.

Rules:
- Each question has exactly 4 answer choices (strings).
- Exactly one answer is correct for the stem as written.
- Vary question style; avoid repeating the same opening words.
- "correctIndex" is 0–3 into the "answers" array (before any client-side shuffling).
- Return ONLY a JSON array (no markdown fences, no commentary, no preamble). The JSON must parse with JSON.parse.

Each array element must be an object with this shape:
{ "question": string, "answers": [string, string, string, string], "correctIndex": number, "questionDifficulty": "easy" | "medium" | "hard", "explanation": string }

The "answers" array must always have length 4.`;
}

function parseQuizJson(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array in response");
  }
  return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
}

function isValidQuestion(item: unknown): item is QuizQuestion {
  if (!item || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  if (typeof o.question !== "string" || o.question.length < 3) return false;
  if (!Array.isArray(o.answers) || o.answers.length !== 4) return false;
  if (!o.answers.every((a) => typeof a === "string" && a.length > 0)) return false;
  const normalized = o.answers.map((a) => (a as string).trim().toLowerCase());
  if (new Set(normalized).size !== 4) return false;
  if (typeof o.correctIndex !== "number" || !Number.isInteger(o.correctIndex)) return false;
  if (o.correctIndex < 0 || o.correctIndex > 3) return false;
  if (!["easy", "medium", "hard"].includes((o.questionDifficulty as string) ?? "")) return false;
  if (typeof o.explanation !== "string" || o.explanation.trim().length < 12) return false;
  return true;
}

function shuffleQuestion(q: QuizQuestion): QuizQuestion {
  const answers = [...q.answers] as string[];
  const correctText = answers[q.correctIndex];
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  const correctIndex = answers.indexOf(correctText) as 0 | 1 | 2 | 3;
  return {
    question: q.question,
    answers: answers as [string, string, string, string],
    correctIndex,
    questionDifficulty: q.questionDifficulty,
    explanation: q.explanation,
  };
}

const SYSTEM = `You are an expert trivia editor: factual, fair, and readable. You output only valid JSON when asked—never markdown fences, apologies, or text outside the JSON array.`;

function isModelOrAvailabilityError(e: unknown): boolean {
  if (e instanceof NotFoundError) return true;
  if (e instanceof BadRequestError) {
    const m = (e.message ?? "").toLowerCase();
    return m.includes("model") || m.includes("not_found");
  }
  if (e instanceof APIError && typeof e.status === "number") {
    if (e.status === 404) return true;
    if (e.status === 400) {
      const m = (e.message ?? "").toLowerCase();
      return m.includes("model");
    }
  }
  return false;
}

function isRetryableGenerationError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const m = e.message;
  return (
    m.includes("No JSON array") ||
    m.includes("Response is not an array") ||
    m.includes("Expected 10 questions") ||
    m.includes("Invalid question object") ||
    m.includes("Wrong difficulty mix")
  );
}

function expectedDifficultyMix(difficulty: TriviaDifficulty): Record<QuestionDifficulty, number> {
  switch (difficulty) {
    case "noob":
      return { easy: 6, medium: 3, hard: 1 };
    case "normal":
      return { easy: 3, medium: 4, hard: 3 };
    case "grandmaster":
      return { easy: 1, medium: 3, hard: 6 };
    default:
      return { easy: 3, medium: 4, hard: 3 };
  }
}

function expectedDifficultyMixExtraCredit(difficulty: TriviaDifficulty): Record<QuestionDifficulty, number> {
  switch (difficulty) {
    case "noob":
      return { easy: 3, medium: 4, hard: 3 };
    case "normal":
      return { easy: 1, medium: 3, hard: 6 };
    case "grandmaster":
      return { easy: 0, medium: 2, hard: 8 };
    default:
      return { easy: 1, medium: 3, hard: 6 };
  }
}

async function generateWithModel(
  anthropic: Anthropic,
  model: string,
  topic: string,
  difficulty: TriviaDifficulty,
  sessionTopics: string[] | undefined,
  gameSeed: string | undefined,
): Promise<{ questions: QuizQuestion[]; inputTokens: number; outputTokens: number; estimatedCostUsd: number }> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    system: SYSTEM,
    messages: [{ role: "user", content: buildUserPrompt(topic, difficulty, sessionTopics, gameSeed) }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text in model response");
  }

  const raw = parseQuizJson(block.text);
  if (!Array.isArray(raw)) {
    throw new Error("Response is not an array");
  }
  if (raw.length !== 10) {
    throw new Error(`Expected 10 questions, got ${raw.length}`);
  }

  const validated: QuizQuestion[] = [];
  for (const item of raw) {
    if (!isValidQuestion(item)) {
      throw new Error("Invalid question object in array");
    }
    validated.push(shuffleQuestion(item));
  }
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const q of validated) counts[q.questionDifficulty]++;
  const extra = isExtraCreditTopic(topic);
  const expected = extra ? expectedDifficultyMixExtraCredit(difficulty) : expectedDifficultyMix(difficulty);
  if (counts.easy !== expected.easy || counts.medium !== expected.medium || counts.hard !== expected.hard) {
    throw new Error("Wrong difficulty mix");
  }
  const inputTokens = message.usage?.input_tokens ?? 0;
  const outputTokens = message.usage?.output_tokens ?? 0;
  const price = MODEL_PRICING_PER_MTOK[model] ?? MODEL_PRICING_PER_MTOK["claude-sonnet-4-6"];
  const estimatedCostUsd = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
  return { questions: validated, inputTokens, outputTokens, estimatedCostUsd };
}

export async function POST(req: Request) {
  let body: GenerateQuizPayload;
  try {
    body = (await req.json()) as GenerateQuizPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic : "";
  const difficulty = body.difficulty;
  const sessionTopics = Array.isArray(body.sessionTopics)
    ? body.sessionTopics.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    : undefined;
  const gameSeed = typeof body.gameSeed === "string" && body.gameSeed.trim().length > 0 ? body.gameSeed.trim() : undefined;
  if (!topic.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }
  if (!["noob", "normal", "grandmaster"].includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      "[generate-quiz] ANTHROPIC_API_KEY not set — using bundled demo questions. Add the key to .env.local for AI-generated quizzes.",
    );
    const demo = OFFLINE_DEMO_QUESTIONS_RAW.map((q) => shuffleQuestion(q));
    return NextResponse.json({ questions: demo, demoMode: true });
  }

  const anthropic = new Anthropic({ apiKey });
  const candidates = modelCandidates();
  let lastErr: unknown;

  for (const model of candidates) {
    try {
      const generated = await generateWithModel(anthropic, model, topic, difficulty, sessionTopics, gameSeed);
      await recordUsageEvent({
        source: "generate-quiz",
        inputTokens: generated.inputTokens,
        outputTokens: generated.outputTokens,
        estimatedCostUsd: generated.estimatedCostUsd,
      });
      return NextResponse.json({ ...generated, modelUsed: model });
    } catch (e) {
      lastErr = e;
      if (e instanceof AuthenticationError) {
        return NextResponse.json(
          {
            error: "Anthropic rejected your API key.",
            hint: "Check ANTHROPIC_API_KEY in .env.local (no spaces, no quotes). Restart npm run dev after saving.",
          },
          { status: 401 },
        );
      }
      if (e instanceof PermissionDeniedError) {
        return NextResponse.json(
          {
            error: "Anthropic denied access for this key or model.",
            hint: "Confirm billing is enabled in the Anthropic console and your key is active.",
          },
          { status: 403 },
        );
      }
      if (e instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Too many requests from Anthropic.", hint: "Wait a minute and try again." },
          { status: 429 },
        );
      }
      if (isModelOrAvailabilityError(e) || isRetryableGenerationError(e)) {
        console.warn(`[generate-quiz] model ${model} failed, trying next if any`, e);
        continue;
      }
      break;
    }
  }

  console.error("generate-quiz", lastErr);
  return NextResponse.json(
    {
      error: "Couldn't generate questions. Try again.",
      hint: "If this keeps happening, set ANTHROPIC_QUIZ_MODEL to a model your account supports (see Anthropic docs) and restart the dev server.",
    },
    { status: 502 },
  );
}
