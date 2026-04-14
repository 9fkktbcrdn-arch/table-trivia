import { createClient } from "@supabase/supabase-js";

/** Records one AI call for cross-device totals. No-op if Supabase env is missing. */
export async function recordUsageEvent(params: {
  source: "generate-quiz" | "generate-topics";
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return;

  const supabase = createClient(url, key);
  const { error } = await supabase.from("usage_events").insert({
    source: params.source,
    input_tokens: Math.max(0, Math.floor(params.inputTokens)),
    output_tokens: Math.max(0, Math.floor(params.outputTokens)),
    estimated_cost_usd: Math.max(0, params.estimatedCostUsd),
  });
  if (error) console.error("[recordUsageEvent]", error);
}
