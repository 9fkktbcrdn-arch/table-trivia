"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopicCard } from "@/components/TopicCard";
import { getTopics } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import { EXTRA_CREDIT_LABEL, LEGACY_GENERAL_TRIVIA_NAME } from "@/lib/trivia-constants";
import type { TopicRow } from "@/lib/types";
import { useTriviaStore } from "@/store/trivia-store";

export default function HomePage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const playerName = useTriviaStore((s) => s.playerName);
  const setPlayer = useTriviaStore((s) => s.setPlayer);
  const inProgress = useTriviaStore((s) => s.inProgress);
  const lockedTopics = useTriviaStore((s) => s.lockedTopics);
  const completedTopics = useTriviaStore((s) => s.completedTopics);
  const startGame = useTriviaStore((s) => s.startGame);
  const resetGame = useTriviaStore((s) => s.resetGame);

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

  const slots: (TopicRow | null)[] = [0, 1, 2, 3, 4].map((i) => topics[i] ?? null);
  const topicNames = [...slots.map((t) => t?.name).filter(Boolean), EXTRA_CREDIT_LABEL] as string[];

  const topicIsDone = (name: string) =>
    completedTopics.includes(name) ||
    (name === EXTRA_CREDIT_LABEL && completedTopics.includes(LEGACY_GENERAL_TRIVIA_NAME));

  const goTopic = (name: string) => {
    if (!playerName) return;
    if (inProgress && topicIsDone(name)) return;
    if (inProgress && !lockedTopics.includes(name)) return;
    if (!inProgress) startGame(topicNames);
    router.push(`/quiz?topic=${encodeURIComponent(name)}`);
  };

  const supabaseOk = isSupabaseConfigured();

  return (
    <div className="tt-screen relative flex min-h-dvh flex-col bg-tt-bg bg-[radial-gradient(ellipse_120%_80%_at_50%_-25%,rgba(177,140,255,0.26),transparent),radial-gradient(ellipse_90%_50%_at_50%_120%,rgba(255,210,77,0.14),transparent)]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-tt-amber/30 bg-tt-surface/45 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="min-w-0">
          <h1 className="font-stat text-2xl font-bold tracking-tight text-tt-amber sm:text-3xl">Table Trivia</h1>
          <p className="mt-0.5 font-body text-sm text-zinc-500 sm:text-base">
            {inProgress ? `Game in progress for ${playerName}. Finish all topics.` : "Pick a topic to start a round."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {inProgress ? (
            <button
              type="button"
              className="tt-btn-ghost min-h-[44px] px-3 text-sm"
              onClick={() => {
                if (confirm("Restart current game? This clears progress.")) resetGame();
              }}
            >
              Reset
            </button>
          ) : null}
          <Link
            href="/scores"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tt-border/80 bg-tt-surface/90 text-lg text-tt-cyan transition hover:border-tt-cyan/50 hover:bg-tt-surface"
            aria-label="High scores"
          >
            🏆
          </Link>
          <Link
            href="/settings"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tt-border/80 bg-tt-surface/90 text-lg text-tt-cyan transition hover:border-tt-cyan/50 hover:bg-tt-surface"
            aria-label="Topic manager"
          >
            ⚙️
          </Link>
        </div>
      </header>
      {!playerName && (
        <div className="mx-4 mt-4 rounded-2xl border border-tt-border bg-tt-surface p-4 sm:mx-6">
          <p className="font-stat text-sm text-tt-cyan/90">Who is playing?</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button type="button" className="tt-btn-primary min-h-[48px]" onClick={() => setPlayer("KJC")}>
              KJC
            </button>
            <button type="button" className="tt-btn-primary min-h-[48px]" onClick={() => setPlayer("CHC")}>
              CHC
            </button>
            <button
              type="button"
              className="tt-btn-primary min-h-[48px]"
              disabled={!guestName.trim()}
              onClick={() => setPlayer("GUEST", guestName)}
            >
              Guest
            </button>
          </div>
          <input
            className="mt-3 min-h-[44px] w-full rounded-xl border border-tt-border/80 bg-tt-bg/80 px-3 font-body text-sm text-white outline-none placeholder:text-zinc-600 focus:border-tt-cyan/50"
            placeholder="Guest name (required if choosing Guest)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </div>
      )}
      {inProgress && completedTopics.length === topicNames.length ? (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-900/25 px-3 py-2.5 sm:mx-6">
          <p className="font-body text-sm text-emerald-200">All topics completed. Start a fresh game anytime.</p>
          <button type="button" className="tt-btn-ghost min-h-[40px] px-3" onClick={resetGame}>
            New game
          </button>
        </div>
      ) : null}
      {inProgress && completedTopics.length < topicNames.length ? (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/25 px-3 py-2.5 sm:mx-6">
          <p className="font-body text-sm text-amber-100">
            {completedTopics.length}/{topicNames.length} topics complete
          </p>
          <button
            type="button"
            className="tt-btn-ghost min-h-[40px] px-3"
            onClick={() => {
              if (confirm("Restart current game? This clears progress.")) resetGame();
            }}
          >
            Restart
          </button>
        </div>
      ) : null}

      {!supabaseOk && (
        <div className="border-b border-amber-500/20 bg-amber-950/25 px-4 py-2.5 sm:px-6">
          <p className="font-body text-xs leading-snug text-amber-100/90 sm:text-sm">
            Optional: add Supabase in <code className="rounded bg-black/25 px-1">.env.local</code> to sync saved topics
            across devices.
          </p>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
        {loading ? (
          <div className="flex flex-1 items-center justify-center font-body text-sm text-zinc-500">Loading topics…</div>
        ) : (
          <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-3.5 sm:max-w-2xl sm:gap-4 md:max-w-4xl md:grid-cols-3">
            {slots.map((row, idx) =>
              row ? (
                <div key={row.id} className="min-w-0">
                  <TopicCard
                    title={row.name}
                    imageUrl={row.image_url}
                    onClick={() => goTopic(row.name)}
                    variant="topic"
                    disabled={!playerName || (inProgress && topicIsDone(row.name))}
                    completed={topicIsDone(row.name)}
                  />
                </div>
              ) : (
                <div key={`empty-${idx}`} className="min-w-0">
                  <TopicCard
                    title="Empty slot"
                    subtitle="Add in settings"
                    onClick={() => {}}
                    variant="empty"
                  />
                </div>
              ),
            )}

            <div className="min-w-0">
              <TopicCard
                title={EXTRA_CREDIT_LABEL}
                subtitle="Synthesis · 2× points"
                onClick={() => goTopic(EXTRA_CREDIT_LABEL)}
                variant="extra"
                disabled={!playerName || (inProgress && topicIsDone(EXTRA_CREDIT_LABEL))}
                completed={topicIsDone(EXTRA_CREDIT_LABEL)}
              />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
