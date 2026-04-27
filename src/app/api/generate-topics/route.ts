import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { recordUsageEvent } from "@/lib/usage-server";

export const runtime = "nodejs";

const MODEL_FALLBACKS = ["claude-sonnet-4-6", "claude-sonnet-4-20250514"] as const;
const MODEL_PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
};

function modelCandidates(): string[] {
  const preferred = process.env.ANTHROPIC_QUIZ_MODEL?.trim();
  return preferred ? [preferred, ...MODEL_FALLBACKS] : [...MODEL_FALLBACKS];
}

function fallbackFromTheme(theme: string): string[] {
  const t = theme.trim() || "General";
  return [`${t} Basics`, `${t} History`, `${t} People`, `${t} Moments`, `${t} Pop Culture`, `${t} Discoveries`];
}

const FALLBACK_GIFTED12_POOL = [
  "Physics & Forces",
  "Logic & Puzzles",
  "World Geography",
  "Mythology & Epics",
  "Programming Concepts",
  "Space Exploration",
  "Ancient Civilizations",
  "Chess & Strategy",
  "Engineering Design",
  "AI & Robotics",
  "Biology Mysteries",
  "Math Patterns",
  "Great Inventors",
  "Ocean Science",
  "Codes & Ciphers",
] as const;

const FALLBACK_MIDDLE_SCHOOL_POOL = [
  "Inventions & Innovators",
  "Earth & Climate",
  "Ancient History",
  "Animals & Adaptations",
  "Coding & Games",
  "World Landmarks",
  "Space Science",
  "Natural Disasters",
  "Human Body",
  "Sports Legends",
  "Greek Myths",
  "Art Through Time",
  "Music & Rhythm",
  "Maps & Nations",
  "Famous Experiments",
] as const;

type RandomTarget = "gifted12" | "middle-school";

function pickRandomTopics(pool: readonly string[], count = 6): string[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function parseTopicsJson(text: string): string[] {
  const trimmed = text.trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array in response");
  }
  const raw = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
  if (!Array.isArray(raw)) throw new Error("Response is not an array");

  const cleaned = raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x.length >= 3 && x.length <= 40);
  const unique = [...new Set(cleaned)];
  if (unique.length < 6) throw new Error("Not enough unique topics");
  return unique.slice(0, 6);
}

function prompt(theme: string): string {
  return `Theme seed: "${theme}"

Generate exactly 6 related but distinct quiz topic names for a family trivia game night.

Rules:
- Each topic must be broad enough for 10 quiz questions.
- All 6 topics should feel adjacent to the theme seed, but not be duplicates.
- Use different angles (history, people, places, events, media, etc.) where possible.
- Keep each topic 1-4 words.
- Return ONLY a JSON array of 6 strings, no markdown or extra text.

Example format:
["Space History","Famous Astronauts","Planet Facts","Sci-Fi Films","Rocket Technology","Space Discoveries"]`;
}

function promptGifted12(randomSeed?: string): string {
  return `Generate exactly 6 distinct quiz category names for a very bright 12-year-old who wants real depth — science, strategy, history, and "cool facts" — never condescending, never grad-school obscure.

Random seed: "${randomSeed ?? "none"}" (use this to vary the resulting category mix across requests)

Rules:
- Each category must be broad enough for 10 trivia questions.
- Use six clearly different domains (no near-duplicates).
- Think: space/physics ideas, logic and riddles, world history, mythology, coding or game design, engineering, nature at a curious-kid level — pick a strong mix.
- Keep each topic 1-4 words.
- Return ONLY a JSON array of 6 strings, no markdown or extra text.

Example format:
["Orbital Mechanics","Logic & Riddles","Ancient Civilizations","Mythology","How Computers Work","Biome Mysteries"]`;
}

function promptMiddleSchool(randomSeed?: string): string {
  return `Generate exactly 6 distinct quiz category names for a curious middle-school learner (roughly ages 11-14): challenging but approachable, broad and fun.

Random seed: "${randomSeed ?? "none"}" (use this to vary the resulting category mix across requests)

Rules:
- Each category must be broad enough for 10 trivia questions.
- Use six clearly different domains (no near-duplicates).
- Include a balanced mix like science, world history, geography, inventions, technology, language, arts, or nature.
- Keep each topic 1-4 words.
- Return ONLY a JSON array of 6 strings, no markdown or extra text.

Example format:
["Inventors & Inventions","World Geography","Ancient History","Space Science","Digital Technology","Wildlife Biology"]`;
}

export async function POST(req: Request) {
  let body: { theme?: unknown; gifted12?: unknown; randomTarget?: unknown; randomSeed?: unknown };
  try {
    body = (await req.json()) as { theme?: unknown; gifted12?: unknown; randomTarget?: unknown; randomSeed?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const randomTarget: RandomTarget =
    body.randomTarget === "middle-school" ? "middle-school" : "gifted12";
  const randomSeed = typeof body.randomSeed === "string" ? body.randomSeed.trim() : "";
  const gifted12 = body.gifted12 === true || (body.randomTarget !== undefined && randomTarget === "gifted12");
  const theme = typeof body.theme === "string" ? body.theme.trim() : "";

  const hasRandomTarget = body.randomTarget === "gifted12" || body.randomTarget === "middle-school";
  if (!gifted12 && !hasRandomTarget && !theme) {
    return NextResponse.json(
      { error: 'Send { theme: "..." } or random mode ({ randomTarget: "gifted12" | "middle-school" }).' },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const userPrompt = gifted12
    ? promptGifted12(randomSeed)
    : body.randomTarget === "middle-school"
      ? promptMiddleSchool(randomSeed)
      : prompt(theme);
  const fallbackTopics = gifted12
    ? pickRandomTopics(FALLBACK_GIFTED12_POOL)
    : body.randomTarget === "middle-school"
      ? pickRandomTopics(FALLBACK_MIDDLE_SCHOOL_POOL)
      : fallbackFromTheme(theme);

  if (!apiKey) {
    return NextResponse.json({
      topics: fallbackTopics,
      demoMode: true,
      ...(body.randomTarget !== undefined ? { randomTarget } : gifted12 ? { gifted12: true } : { theme }),
    });
  }

  const anthropic = new Anthropic({ apiKey });
  for (const model of modelCandidates()) {
    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: "You generate concise category lists and output valid JSON only.",
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = message.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") throw new Error("No text in model response");
      const topics = parseTopicsJson(block.text);
      const inputTokens = message.usage?.input_tokens ?? 0;
      const outputTokens = message.usage?.output_tokens ?? 0;
      const price = MODEL_PRICING_PER_MTOK[model] ?? MODEL_PRICING_PER_MTOK["claude-sonnet-4-6"];
      const estimatedCostUsd = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
      await recordUsageEvent({
        source: "generate-topics",
        inputTokens,
        outputTokens,
        estimatedCostUsd,
      });
      return NextResponse.json({
        topics,
        modelUsed: model,
        inputTokens,
        outputTokens,
        estimatedCostUsd,
        ...(body.randomTarget !== undefined ? { randomTarget } : gifted12 ? { gifted12: true } : { theme }),
      });
    } catch (e) {
      console.warn(`[generate-topics] model ${model} failed`, e);
    }
  }

  return NextResponse.json(
    {
      topics: fallbackTopics,
      error: "Fell back to default topics because generation failed.",
      demoMode: true,
      ...(body.randomTarget !== undefined ? { randomTarget } : gifted12 ? { gifted12: true } : { theme }),
    },
    { status: 200 },
  );
}
