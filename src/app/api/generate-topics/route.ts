import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

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
  return [`${t} Basics`, `${t} History`, `${t} People`, `${t} Moments`, `${t} Pop Culture`];
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
  if (unique.length < 5) throw new Error("Not enough unique topics");
  return unique.slice(0, 5);
}

function prompt(theme: string): string {
  return `Theme seed: "${theme}"

Generate exactly 5 related but distinct quiz topic names for a family trivia game night.

Rules:
- Each topic must be broad enough for 10 quiz questions.
- All 5 topics should feel adjacent to the theme seed, but not be duplicates.
- Use different angles (history, people, places, events, media, etc.) where possible.
- Keep each topic 1-4 words.
- Do not include "General Trivia".
- Return ONLY a JSON array of 5 strings, no markdown or extra text.

Example format:
["Space History","Famous Astronauts","Planet Facts","Sci-Fi Films","Rocket Technology"]`;
}

export async function POST(req: Request) {
  let theme = "";
  try {
    const body = (await req.json()) as { theme?: unknown };
    theme = typeof body.theme === "string" ? body.theme.trim() : "";
  } catch {
    // ignore
  }

  if (!theme) {
    return NextResponse.json({ error: "Theme is required." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ topics: fallbackFromTheme(theme), demoMode: true });
  }

  const anthropic = new Anthropic({ apiKey });
  for (const model of modelCandidates()) {
    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: "You generate concise category lists and output valid JSON only.",
        messages: [{ role: "user", content: prompt(theme) }],
      });
      const block = message.content.find((b) => b.type === "text");
      if (!block || block.type !== "text") throw new Error("No text in model response");
      const topics = parseTopicsJson(block.text);
      const inputTokens = message.usage?.input_tokens ?? 0;
      const outputTokens = message.usage?.output_tokens ?? 0;
      const price = MODEL_PRICING_PER_MTOK[model] ?? MODEL_PRICING_PER_MTOK["claude-sonnet-4-6"];
      const estimatedCostUsd = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
      return NextResponse.json({ topics, modelUsed: model, theme, inputTokens, outputTokens, estimatedCostUsd });
    } catch (e) {
      console.warn(`[generate-topics] model ${model} failed`, e);
    }
  }

  return NextResponse.json(
    {
      topics: fallbackFromTheme(theme),
      error: "Fell back to default topics because generation failed.",
      demoMode: true,
      theme,
    },
    { status: 200 },
  );
}
