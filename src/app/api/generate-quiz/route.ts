import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { GenerateQuizPayload, QuizQuestion, TriviaDifficulty } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-20250514";

function difficultyGuidance(d: TriviaDifficulty): string {
  switch (d) {
    case "noob":
      return `Difficulty: NOOB (easy). Questions must be simple recall suitable for kids about ages 6–10: straightforward facts, no trick wording, well-known details only.`;
    case "normal":
      return `Difficulty: NORMAL (medium). Moderate challenge: fine for older kids and casual adults; mix of common and less-obvious facts.`;
    case "grandmaster":
      return `Difficulty: GRAND MASTER (hard). Expert-level, deep-cut, and specific knowledge that would challenge a devoted fan of the topic.`;
    default:
      return "";
  }
}

function buildUserPrompt(topic: string, difficulty: TriviaDifficulty): string {
  const isGeneral = topic.trim().toLowerCase() === "general trivia";
  const topicLine = isGeneral
    ? `Topic: GENERAL TRIVIA — broad world knowledge across many subjects (science, history, geography, arts, sports, pop culture). Do not focus on a single franchise.`
    : `Topic: "${topic.trim()}". All questions must be clearly about this topic.`;

  return `${topicLine}

${difficultyGuidance(difficulty)}

Generate exactly 10 multiple-choice trivia questions.

Rules:
- Each question has exactly 4 answer choices (strings).
- Exactly one answer is correct.
- Vary question style; avoid repeating the same phrasing.
- "correctIndex" is 0–3 pointing into the "answers" array (before any client-side shuffling).
- Return ONLY a JSON array (no markdown fences, no commentary, no preamble). The JSON must parse with JSON.parse.

Each array element must be an object with this shape:
{ "question": string, "answers": [string, string, string, string], "correctIndex": number }

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
  if (typeof o.correctIndex !== "number" || !Number.isInteger(o.correctIndex)) return false;
  if (o.correctIndex < 0 || o.correctIndex > 3) return false;
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
  };
}

const SYSTEM = `You are an expert trivia writer. You output only valid JSON when asked. Never include markdown, apologies, or text outside the JSON array.`;

export async function POST(req: Request) {
  let body: GenerateQuizPayload;
  try {
    body = (await req.json()) as GenerateQuizPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = typeof body.topic === "string" ? body.topic : "";
  const difficulty = body.difficulty;
  if (!topic.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }
  if (!["noob", "normal", "grandmaster"].includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server misconfigured: missing API key" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM,
      messages: [{ role: "user", content: buildUserPrompt(topic, difficulty) }],
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

    return NextResponse.json({ questions: validated });
  } catch (e) {
    console.error("generate-quiz", e);
    return NextResponse.json(
      { error: "Couldn't generate questions, try again." },
      { status: 502 },
    );
  }
}
