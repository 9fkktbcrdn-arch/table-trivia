"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  addTopic,
  clearUsageEvents,
  deleteTopic,
  getTopics,
  getUsageTotals,
  reorderTopics,
  updateTopic,
  type UsageTotals,
} from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { TopicRow } from "@/lib/types";
import { useTriviaStore } from "@/store/trivia-store";

const MAX_TOPICS = 5;

export default function SettingsPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingKind, setGeneratingKind] = useState<null | "theme" | "gifted">(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [themeSeed, setThemeSeed] = useState("");
  const [cloudUsage, setCloudUsage] = useState<UsageTotals | null>(null);
  const [usageLoading, setUsageLoading] = useState(() => isSupabaseConfigured());

  const load = useCallback(async () => {
    setLoading(true);
    setTopics(await getTopics());
    setLoading(false);
  }, []);

  const refreshCloudUsage = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setUsageLoading(true);
    try {
      setCloudUsage(await getUsageTotals());
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await getTopics();
      if (!cancelled) {
        setTopics(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshCloudUsage();
  }, [refreshCloudUsage]);

  const supabaseOk = isSupabaseConfigured();
  const inProgress = useTriviaStore((s) => s.inProgress);
  const resetGame = useTriviaStore((s) => s.resetGame);
  const addUsage = useTriviaStore((s) => s.addUsage);
  const totalInputTokens = useTriviaStore((s) => s.totalInputTokens);
  const totalOutputTokens = useTriviaStore((s) => s.totalOutputTokens);
  const totalEstimatedCostUsd = useTriviaStore((s) => s.totalEstimatedCostUsd);
  const resetUsage = useTriviaStore((s) => s.resetUsage);

  const persistOrder = async (rows: TopicRow[]) => {
    setTopics(rows);
    await reorderTopics(rows.map((r) => r.id));
    await load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= topics.length) return;
    const next = [...topics];
    [next[index], next[j]] = [next[j], next[index]];
    await persistOrder(next);
  };

  const onRename = async (id: string, name: string) => {
    setSaving(true);
    await updateTopic(id, { name });
    await load();
    setSaving(false);
  };

  const onImageUrlBlur = async (id: string, previousUrl: string | null, value: string) => {
    const next = value.trim() || null;
    const prev = previousUrl?.trim() || null;
    if (next === prev) return;
    setSaving(true);
    await updateTopic(id, { image_url: next });
    await load();
    setSaving(false);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    setSaving(true);
    await deleteTopic(id);
    await load();
    setSaving(false);
  };

  const onAdd = async () => {
    const n = newName.trim();
    if (!n) return;
    if (topics.length >= MAX_TOPICS) {
      setNotice(`You already have ${MAX_TOPICS} topics. Delete one or use Randomize 5.`);
      return;
    }
    setSaving(true);
    setNotice(null);
    await addTopic(n, newImageUrl.trim() || null);
    setNewName("");
    setNewImageUrl("");
    await load();
    setSaving(false);
  };

  const applyGeneratedTopics = async (
    data: {
      topics?: string[];
      demoMode?: boolean;
      inputTokens?: number;
      outputTokens?: number;
      estimatedCostUsd?: number;
    },
    successNotice: string,
  ) => {
    if (!data.topics || data.topics.length !== MAX_TOPICS) {
      setNotice("Couldn't generate topics right now.");
      return;
    }
    if (!data.demoMode && !isSupabaseConfigured()) {
      addUsage(data.inputTokens ?? 0, data.outputTokens ?? 0, data.estimatedCostUsd ?? 0);
    }
    await Promise.all(topics.map((t) => deleteTopic(t.id)));
    for (const name of data.topics) {
      await addTopic(name);
    }
    await load();
    await refreshCloudUsage();
    setNotice(successNotice);
  };

  const onRandomizeTopics = async () => {
    const theme = themeSeed.trim();
    if (!theme) {
      setNotice("Enter a theme first (example: Space, 90s, Animals).");
      return;
    }
    if (!confirm(`Replace your current topics with 5 new ones from that theme?`)) return;
    setGeneratingKind("theme");
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const data = (await res.json()) as {
        topics?: string[];
        error?: string;
        demoMode?: boolean;
        inputTokens?: number;
        outputTokens?: number;
        estimatedCostUsd?: number;
      };
      if (!res.ok || !data.topics || data.topics.length !== MAX_TOPICS) {
        setNotice(data.error ?? "Couldn't generate topics right now.");
        return;
      }
      await applyGeneratedTopics(data, `Topics updated from theme: "${theme}".`);
    } catch {
      setNotice("Couldn't generate topics right now.");
    } finally {
      setGeneratingKind(null);
      setSaving(false);
    }
  };

  const onRandomGiftedTopics = async () => {
    if (!confirm("Replace your current topics with 5 random categories for a bright 12-year-old?")) return;
    setGeneratingKind("gifted");
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gifted12: true }),
      });
      const data = (await res.json()) as {
        topics?: string[];
        error?: string;
        demoMode?: boolean;
        inputTokens?: number;
        outputTokens?: number;
        estimatedCostUsd?: number;
      };
      if (!res.ok || !data.topics || data.topics.length !== MAX_TOPICS) {
        setNotice(data.error ?? "Couldn't generate topics right now.");
        return;
      }
      await applyGeneratedTopics(data, "Topics updated: 5 random gifted-12 categories.");
    } catch {
      setNotice("Couldn't generate topics right now.");
    } finally {
      setGeneratingKind(null);
      setSaving(false);
    }
  };

  if (!supabaseOk) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 py-8 sm:px-6">
        <Link href="/" className="tt-btn-ghost mb-6 inline-flex min-h-[48px] w-fit items-center px-2">
          ← Back
        </Link>
        <p className="font-body text-lg text-amber-200/90">
          Configure <code className="text-tt-cyan">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-tt-cyan">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to manage saved topics.
        </p>
      </div>
    );
  }

  return (
    <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 pb-10 pt-6 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="tt-btn-ghost min-h-[48px] min-w-[48px] px-2">
          ←
        </Link>
        <div>
          <h1 className="font-stat text-2xl font-bold text-white">Topic Manager</h1>
          <p className="font-body text-sm text-zinc-500">Saved on Supabase for every device.</p>
        </div>
      </header>
      {inProgress ? (
        <p className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/25 px-3 py-2 text-sm text-amber-100">
          A game is currently in progress. Finish all topics before changing the list.
        </p>
      ) : null}
      <div className="mb-4 rounded-2xl border border-tt-border bg-tt-surface/80 p-4">
        <p className="font-stat text-sm font-semibold text-tt-cyan/90">Game controls</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="tt-btn-ghost min-h-[44px] w-full sm:w-auto sm:px-6"
            onClick={() => {
              if (!inProgress || confirm("Restart current game? This clears topic progress.")) resetGame();
            }}
          >
            Restart game
          </button>
        </div>
      </div>
      <div className="mb-4 rounded-2xl border border-tt-border bg-tt-surface/80 p-4">
        <p className="font-stat text-sm font-semibold text-tt-cyan/90">AI token usage</p>
        {usageLoading ? (
          <p className="mt-1 font-body text-xs text-zinc-500">Loading…</p>
        ) : supabaseOk && cloudUsage ? (
          <>
            <p className="mt-1 font-body text-xs text-zinc-400">
              All devices (Supabase): Input {cloudUsage.inputTokens.toLocaleString()} · Output{" "}
              {cloudUsage.outputTokens.toLocaleString()}
            </p>
            <p className="mt-1 font-body text-sm text-zinc-200">
              Estimated spend: ${cloudUsage.estimatedCostUsd.toFixed(4)}
            </p>
          </>
        ) : supabaseOk && cloudUsage === null ? (
          <>
            <p className="mt-1 font-body text-xs text-amber-200/90">
              Couldn&apos;t load synced totals. Check the <code className="text-zinc-400">usage_events</code> table and
              migration.
            </p>
            <p className="mt-1 font-body text-xs text-zinc-400">
              This browser only: Input {totalInputTokens.toLocaleString()} · Output{" "}
              {totalOutputTokens.toLocaleString()}
            </p>
            <p className="mt-1 font-body text-sm text-zinc-200">
              Estimated spend: ${totalEstimatedCostUsd.toFixed(4)}
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 font-body text-xs text-zinc-400">
              This browser only: Input {totalInputTokens.toLocaleString()} · Output{" "}
              {totalOutputTokens.toLocaleString()}
            </p>
            <p className="mt-1 font-body text-sm text-zinc-200">
              Estimated spend: ${totalEstimatedCostUsd.toFixed(4)}
            </p>
            <p className="mt-2 font-body text-xs text-zinc-500">
              Add Supabase env vars and run migration <code className="text-zinc-400">003_usage_events.sql</code> to
              sync totals across phones and laptops.
            </p>
          </>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {supabaseOk ? (
            <button
              type="button"
              className="tt-btn-ghost min-h-[40px] px-3"
              disabled={usageLoading}
              onClick={() => void refreshCloudUsage()}
            >
              Refresh totals
            </button>
          ) : null}
          <button
            type="button"
            className="tt-btn-ghost min-h-[40px] px-3"
            onClick={() => {
              if (!confirm("Clear saved usage totals?")) return;
              void (async () => {
                await clearUsageEvents();
                resetUsage();
                await refreshCloudUsage();
              })();
            }}
          >
            Reset usage
          </button>
        </div>
      </div>
      {notice ? <p className="mb-4 rounded-xl border border-tt-border/80 bg-tt-surface/70 px-3 py-2 text-sm text-zinc-300">{notice}</p> : null}

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {topics.map((t, i) => (
            <li
              key={t.id}
              className="flex flex-col gap-2 rounded-2xl border border-tt-border bg-tt-surface/90 p-3 sm:p-4"
            >
              <input
                key={`name-${t.id}-${t.name}`}
                defaultValue={t.name}
                disabled={saving || inProgress}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== t.name) void onRename(t.id, v);
                }}
                className="min-h-[48px] w-full rounded-xl border border-tt-border bg-tt-bg px-3 font-body text-lg text-white outline-none focus:border-tt-cyan/60"
                aria-label="Topic name"
              />
              <input
                key={`img-${t.id}-${t.image_url ?? ""}`}
                defaultValue={t.image_url ?? ""}
                disabled={saving || inProgress}
                onBlur={(e) => void onImageUrlBlur(t.id, t.image_url, e.target.value)}
                placeholder="Image URL (optional) — paste a direct link to a .jpg or .png"
                className="min-h-[44px] w-full rounded-xl border border-tt-border/80 bg-tt-bg/80 px-3 font-body text-sm text-white outline-none placeholder:text-zinc-600 focus:border-tt-cyan/50"
                aria-label="Topic image URL"
              />
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  className="tt-btn-ghost min-h-[48px] min-w-[48px] px-0"
                  aria-label="Move up"
                  disabled={i === 0 || saving || inProgress}
                  onClick={() => void move(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="tt-btn-ghost min-h-[48px] min-w-[48px] px-0"
                  aria-label="Move down"
                  disabled={i === topics.length - 1 || saving || inProgress}
                  onClick={() => void move(i, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="min-h-[48px] rounded-xl border border-tt-rose/50 px-3 font-stat text-sm text-tt-rose disabled:opacity-50"
                  disabled={saving || inProgress}
                  onClick={() => void onDelete(t.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 rounded-2xl border border-dashed border-tt-border/80 bg-tt-bg/80 p-4">
        <p className="font-stat text-sm font-semibold text-tt-cyan/90">Add topic ({topics.length}/{MAX_TOPICS})</p>
        <p className="mt-1 font-body text-xs text-zinc-500">
          For tile art, use a <strong>direct image link</strong> (ends in .jpg / .png / .webp or a CDN URL that shows only the image). Run the SQL migration{" "}
          <code className="text-zinc-400">002_topic_image_url.sql</code> in Supabase if you haven&apos;t yet.
        </p>
        <input
          className="mt-3 min-h-[48px] w-full rounded-xl border border-tt-border bg-tt-surface px-3 font-body text-lg text-white outline-none focus:border-tt-cyan/60"
          placeholder="Topic name, e.g. Liverpool FC"
          value={newName}
          disabled={saving || inProgress || topics.length >= MAX_TOPICS}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          className="mt-2 min-h-[44px] w-full rounded-xl border border-tt-border/80 bg-tt-bg/80 px-3 font-body text-sm text-white outline-none placeholder:text-zinc-600 focus:border-tt-cyan/50"
          placeholder="Optional image URL for the home tile"
          value={newImageUrl}
          disabled={saving || inProgress || topics.length >= MAX_TOPICS}
          onChange={(e) => setNewImageUrl(e.target.value)}
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="tt-btn-primary min-h-[48px] w-full sm:w-auto sm:px-8"
            disabled={saving || inProgress || topics.length >= MAX_TOPICS}
            onClick={() => void onAdd()}
          >
            Add
          </button>
          <button
            type="button"
            className="tt-btn-ghost min-h-[48px] w-full sm:w-auto sm:px-8"
            disabled={saving || generatingKind !== null || inProgress}
            onClick={() => void onRandomizeTopics()}
          >
            {generatingKind === "theme" ? "Generating..." : "Generate 5 From Theme"}
          </button>
          <button
            type="button"
            className="tt-btn-ghost min-h-[48px] w-full sm:w-auto sm:px-8"
            disabled={saving || generatingKind !== null || inProgress}
            onClick={() => void onRandomGiftedTopics()}
          >
            {generatingKind === "gifted" ? "Generating..." : "Random 5 (gifted 12)"}
          </button>
        </div>
        <label className="mt-3 flex flex-col gap-1 font-body text-xs text-zinc-500">
          Theme for related categories
          <input
            className="min-h-[44px] rounded-xl border border-tt-border/80 bg-tt-bg/80 px-3 font-body text-sm text-white outline-none placeholder:text-zinc-600 focus:border-tt-cyan/50"
            placeholder="Example: Space, Marvel, 1980s, Nature"
            value={themeSeed}
            disabled={saving || generatingKind !== null || inProgress}
            onChange={(e) => setThemeSeed(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
