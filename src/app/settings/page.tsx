"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { addTopic, clearUsageEvents, deleteTopic, getTopics, getUsageTotals, updateTopic, type UsageTotals } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { TopicRow } from "@/lib/types";
import { useTriviaStore } from "@/store/trivia-store";

const MAX_TOPICS = 5;
const RANDOM_TARGET_STORAGE_KEY = "table-trivia-random-target";
type RandomTarget = "gifted12" | "middle-school";

export default function SettingsPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingKind, setGeneratingKind] = useState<null | "theme" | "gifted">(null);
  const [topicGeneratorMode, setTopicGeneratorMode] = useState<"theme" | "random">("random");
  const [randomTarget, setRandomTarget] = useState<RandomTarget>("gifted12");
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(RANDOM_TARGET_STORAGE_KEY);
    if (raw === "middle-school" || raw === "gifted12") {
      setRandomTarget(raw);
    }
  }, []);

  const supabaseOk = isSupabaseConfigured();
  const inProgress = useTriviaStore((s) => s.inProgress);
  const addUsage = useTriviaStore((s) => s.addUsage);
  const totalInputTokens = useTriviaStore((s) => s.totalInputTokens);
  const totalOutputTokens = useTriviaStore((s) => s.totalOutputTokens);
  const totalEstimatedCostUsd = useTriviaStore((s) => s.totalEstimatedCostUsd);
  const resetUsage = useTriviaStore((s) => s.resetUsage);

  const onRename = async (id: string, name: string) => {
    setSaving(true);
    await updateTopic(id, { name });
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

  const onGenerateThemeTopics = async () => {
    const theme = themeSeed.trim();
    if (!theme) {
      setNotice("Enter a theme first (example: Space, 90s, Animals).");
      return;
    }
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
    setGeneratingKind("gifted");
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ randomTarget, randomSeed: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }),
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
      await applyGeneratedTopics(
        data,
        randomTarget === "gifted12"
          ? "Topics updated: 5 random gifted-12 categories."
          : "Topics updated: 5 random middle-school categories.",
      );
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
    <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 pb-10 pt-5 sm:px-6">
      <header className="mb-5 flex items-center gap-3 rounded-2xl border border-[rgba(212,160,23,0.2)] bg-tt-surface px-3 py-2.5">
        <Link href="/" className="tt-btn-ghost min-h-[48px] min-w-[48px] px-2">
          ←
        </Link>
        <div>
          <h1 className="font-stat text-[18px] font-bold text-white">Topic Manager</h1>
          <p className="font-body text-sm text-tt-subtle">Saved on Supabase for every device.</p>
        </div>
      </header>
      {inProgress ? (
        <p className="mb-4 rounded-lg border border-[rgba(245,166,35,0.3)] bg-[rgba(245,166,35,0.12)] px-3 py-2 text-[13px] text-tt-warning">
          A game is currently in progress. Finish all topics before changing the list.
        </p>
      ) : null}
      {notice ? (
        <p className="tt-alert mb-4">{notice}</p>
      ) : null}

      {loading ? (
        <p className="text-tt-subtle">Loading…</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {topics.map((t) => (
            <li
              key={t.id}
              className="rounded-2xl border border-[rgba(212,160,23,0.2)] bg-tt-surface p-4"
            >
              <div className="flex items-center gap-2">
                <input
                  key={`name-${t.id}-${t.name}`}
                  defaultValue={t.name}
                  disabled={saving || inProgress}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== t.name) void onRename(t.id, v);
                  }}
                  className="min-h-[42px] w-full rounded-xl border border-white/10 bg-tt-surface-mid px-3 font-body text-sm text-white outline-none focus:border-tt-gold"
                  aria-label="Topic name"
                />
                <button
                  type="button"
                  className="min-h-[34px] shrink-0 rounded-full border border-[rgba(232,64,64,0.3)] px-3 font-stat text-xs font-semibold text-tt-error disabled:opacity-50"
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

      <div className="mt-6 rounded-2xl border border-[rgba(212,160,23,0.2)] bg-tt-surface p-4">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-tt-subtle">
          Topic generator
        </p>
        <p className="mt-1 font-body text-xs text-tt-subtle">
          Edit topic names directly in the text boxes above, or generate a fresh set below.
        </p>

        <div className="mt-3 rounded-2xl border border-[rgba(212,160,23,0.2)] bg-tt-surface-mid p-4">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-tt-subtle">Generate 5 topics</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`min-h-[44px] rounded-xl border px-3 font-stat text-sm transition ${
                topicGeneratorMode === "theme"
                  ? "border-tt-gold bg-[rgba(212,160,23,0.15)] text-tt-gold-bright"
                  : "border-white/20 bg-transparent text-white hover:border-tt-gold"
              }`}
              disabled={saving || generatingKind !== null || inProgress}
              onClick={() => setTopicGeneratorMode("theme")}
            >
              Theme
            </button>
            <button
              type="button"
              className={`min-h-[44px] rounded-xl border px-3 font-stat text-sm transition ${
                topicGeneratorMode === "random"
                  ? "border-tt-gold bg-[rgba(212,160,23,0.15)] text-tt-gold-bright"
                  : "border-white/20 bg-transparent text-white hover:border-tt-gold"
              }`}
              disabled={saving || generatingKind !== null || inProgress}
              onClick={() => setTopicGeneratorMode("random")}
            >
              Random
            </button>
          </div>

          {topicGeneratorMode === "theme" ? (
            <div className="mt-3">
              <div className="rounded-xl border border-white/10 bg-tt-surface px-3 py-2">
                <p className="font-body text-xs text-tt-subtle">Theme</p>
              </div>
              <input
                className="mt-2 min-h-[44px] w-full rounded-xl border border-white/10 bg-tt-surface px-3 font-body text-sm text-white outline-none placeholder:text-tt-faint focus:border-tt-gold"
                placeholder="Example: Space, Marvel, 1980s, Nature"
                value={themeSeed}
                disabled={saving || generatingKind !== null || inProgress}
                onChange={(e) => setThemeSeed(e.target.value)}
              />
              <button
                type="button"
                className="mt-3 min-h-[44px] w-full rounded-full border border-white/20 bg-transparent px-5 py-2.5 font-stat text-sm font-semibold text-white transition hover:border-tt-gold disabled:opacity-50 sm:mx-auto sm:block sm:w-[220px]"
                disabled={saving || generatingKind !== null || inProgress}
                onClick={() => void onGenerateThemeTopics()}
              >
                {generatingKind === "theme" ? "Generating..." : "Generate"}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-tt-surface px-3 py-2">
                <p className="font-body text-xs text-tt-subtle">Aimed for</p>
                <button
                  type="button"
                  className="rounded-full border border-white/20 bg-transparent px-3 py-1 font-stat text-[11px] font-semibold uppercase tracking-[0.08em] text-white hover:border-tt-gold"
                  disabled={saving || generatingKind !== null || inProgress}
                  onClick={() => {
                    const next: RandomTarget = randomTarget === "gifted12" ? "middle-school" : "gifted12";
                    setRandomTarget(next);
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(RANDOM_TARGET_STORAGE_KEY, next);
                    }
                  }}
                >
                  {randomTarget === "gifted12" ? "Gifted 12" : "Middle School"}
                </button>
              </div>
              <button
                type="button"
                className="mt-3 min-h-[44px] w-full rounded-full border border-white/20 bg-transparent px-5 py-2.5 font-stat text-sm font-semibold text-white transition hover:border-tt-gold disabled:opacity-50 sm:mx-auto sm:block sm:w-[220px]"
                disabled={saving || generatingKind !== null || inProgress}
                onClick={() => void onRandomGiftedTopics()}
              >
                {generatingKind === "gifted" ? "Generating..." : "Generate"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[rgba(212,160,23,0.2)] bg-tt-surface p-4">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-tt-subtle">AI token usage</p>
        {usageLoading ? (
          <p className="mt-1 font-body text-xs text-tt-subtle">Loading…</p>
        ) : supabaseOk && cloudUsage ? (
          <>
            <p className="mt-1 font-body text-xs text-tt-subtle">
              All devices (Supabase): Input {cloudUsage.inputTokens.toLocaleString()} · Output{" "}
              {cloudUsage.outputTokens.toLocaleString()}
            </p>
            <p className="mt-1 font-body text-sm text-white">
              Estimated spend: ${cloudUsage.estimatedCostUsd.toFixed(4)}
            </p>
          </>
        ) : supabaseOk && cloudUsage === null ? (
          <>
            <p className="mt-1 font-body text-xs text-tt-warning">
              Couldn&apos;t load synced totals. Check the <code className="text-zinc-400">usage_events</code> table and
              migration.
            </p>
            <p className="mt-1 font-body text-xs text-tt-subtle">
              This browser only: Input {totalInputTokens.toLocaleString()} · Output{" "}
              {totalOutputTokens.toLocaleString()}
            </p>
            <p className="mt-1 font-body text-sm text-white">
              Estimated spend: ${totalEstimatedCostUsd.toFixed(4)}
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 font-body text-xs text-tt-subtle">
              This browser only: Input {totalInputTokens.toLocaleString()} · Output{" "}
              {totalOutputTokens.toLocaleString()}
            </p>
            <p className="mt-1 font-body text-sm text-white">
              Estimated spend: ${totalEstimatedCostUsd.toFixed(4)}
            </p>
            <p className="mt-2 font-body text-xs text-tt-subtle">
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
    </div>
  );
}
