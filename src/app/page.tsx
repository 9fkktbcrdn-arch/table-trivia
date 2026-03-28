"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopicCard } from "@/components/TopicCard";
import { getTopics } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import { GENERAL_TRIVIA_LABEL } from "@/lib/trivia-constants";
import type { TopicRow } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

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

  const slots: (TopicRow | null)[] = [0, 1, 2, 3].map((i) => topics[i] ?? null);

  const goTopic = (name: string) => {
    router.push(`/quiz?topic=${encodeURIComponent(name)}`);
  };

  const submitCustom = () => {
    const t = customTopic.trim();
    if (!t) return;
    setCreateOpen(false);
    setCustomTopic("");
    goTopic(t);
  };

  const supabaseOk = isSupabaseConfigured();

  return (
    <div className="tt-screen relative flex min-h-dvh flex-col bg-tt-bg bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,238,0.12),transparent)]">
      <header className="flex shrink-0 items-start justify-between px-4 pb-2 pt-4 sm:px-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-stat text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Table Trivia
          </motion.h1>
          <p className="mt-1 font-body text-base text-zinc-400">Pick a topic — dinner &amp; a show.</p>
        </div>
        <Link
          href="/settings"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-tt-border bg-tt-surface/90 text-xl text-tt-cyan transition hover:border-tt-cyan/60"
          aria-label="Topic manager"
        >
          ⚙️
        </Link>
      </header>

      {!supabaseOk && (
        <p className="mx-4 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-2 font-body text-sm text-amber-200/95 sm:mx-6">
          Add Supabase env vars to sync topics across devices. You can still play General Trivia and custom topics.
        </p>
      )}

      <main className="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-2 sm:px-6">
        {loading ? (
          <div className="flex flex-1 items-center justify-center font-body text-zinc-500">Loading topics…</div>
        ) : (
          <div className="grid flex-1 grid-cols-2 content-start gap-3 sm:gap-4">
            {slots.map((row, idx) =>
              row ? (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <TopicCard title={row.name} onClick={() => goTopic(row.name)} variant="topic" />
                </motion.div>
              ) : (
                <TopicCard
                  key={`empty-${idx}`}
                  title="Empty slot"
                  subtitle="Add in settings"
                  onClick={() => {}}
                  variant="empty"
                />
              ),
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <TopicCard title={GENERAL_TRIVIA_LABEL} onClick={() => goTopic(GENERAL_TRIVIA_LABEL)} variant="general" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
              <TopicCard title="Create Your Own…" onClick={() => setCreateOpen(true)} variant="create" />
            </motion.div>
          </div>
        )}
      </main>

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="custom-topic-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-tt-border bg-tt-surface p-5 shadow-2xl"
          >
            <h2 id="custom-topic-title" className="font-stat text-xl font-bold text-white">
              Your topic
            </h2>
            <p className="mt-1 font-body text-sm text-zinc-400">One line — we won&apos;t save it unless you add it in settings.</p>
            <input
              className="mt-4 w-full rounded-xl border-2 border-tt-border bg-tt-bg px-4 py-3 font-body text-lg text-white outline-none focus:border-tt-cyan/70"
              placeholder="e.g. 1990s cartoons"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submitCustom()}
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="tt-btn-secondary min-h-[48px] flex-1"
                onClick={() => {
                  setCreateOpen(false);
                  setCustomTopic("");
                }}
              >
                Cancel
              </button>
              <button type="button" className="tt-btn-primary min-h-[48px] flex-1" onClick={submitCustom}>
                Start
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
