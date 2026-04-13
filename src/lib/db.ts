import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ScoreRow, TopicRow } from "@/lib/types";

export async function getTopics(): Promise<TopicRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("topics").select("*").order("sort_order", { ascending: true });
  if (error) {
    console.error("getTopics", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    ...(row as TopicRow),
    image_url: (row as TopicRow).image_url ?? null,
  }));
}

export async function addTopic(name: string, imageUrl?: string | null): Promise<TopicRow | null> {
  if (!isSupabaseConfigured()) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const img = imageUrl?.trim() || null;
  const supabase = getSupabaseBrowserClient();
  const { data: maxRow } = await supabase.from("topics").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;
  const { data, error } = await supabase
    .from("topics")
    .insert({ name: trimmed, sort_order: nextOrder, image_url: img })
    .select()
    .single();
  if (error) {
    console.error("addTopic", error);
    return null;
  }
  return data as TopicRow;
}

export async function updateTopic(
  id: string,
  patch: { name?: string; image_url?: string | null },
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const payload: Record<string, string | null> = {};
  if (patch.name !== undefined) {
    const t = patch.name.trim();
    if (!t) return false;
    payload.name = t;
  }
  if (patch.image_url !== undefined) {
    payload.image_url = patch.image_url?.trim() ? patch.image_url.trim() : null;
  }
  if (Object.keys(payload).length === 0) return false;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("topics").update(payload).eq("id", id);
  if (error) {
    console.error("updateTopic", error);
    return false;
  }
  return true;
}

export async function deleteTopic(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("topics").delete().eq("id", id);
  if (error) {
    console.error("deleteTopic", error);
    return false;
  }
  return true;
}

export async function reorderTopics(ids: string[]): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowserClient();
  const updates = ids.map((id, index) =>
    supabase.from("topics").update({ sort_order: index }).eq("id", id),
  );
  const results = await Promise.all(updates);
  const failed = results.some((r) => r.error);
  if (failed) {
    console.error("reorderTopics", results.map((r) => r.error));
    return false;
  }
  return true;
}

export async function saveScore(params: {
  topic: string;
  difficulty: string;
  score: number;
  mode: string;
  playerName?: string | null;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("scores").insert({
    topic: params.topic,
    difficulty: params.difficulty,
    score: params.score,
    mode: params.mode,
    player_name: params.playerName ?? null,
  });
  if (error) {
    console.error("saveScore", error);
    return false;
  }
  return true;
}

export async function getScores(limit = 50): Promise<ScoreRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getScores", error);
    return [];
  }
  return (data ?? []) as ScoreRow[];
}

export async function getHighScores(limit = 20): Promise<ScoreRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getHighScores", error);
    return [];
  }
  return (data ?? []) as ScoreRow[];
}
