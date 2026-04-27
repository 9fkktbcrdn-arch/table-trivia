"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopicCard } from "@/components/TopicCard";
import { getTopics } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
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

  useEffect(() => {
    // Heal stale persisted sessions from older builds.
    if (inProgress && lockedTopics.length < 2) {
      resetGame();
    }
  }, [inProgress, lockedTopics.length, resetGame]);

  const slots: (TopicRow | null)[] = [0, 1, 2, 3, 4, 5].map((i) => topics[i] ?? null);
  const topicNames = slots.map((t) => t?.name).filter((name): name is string => Boolean(name));

  const topicIsDone = (name: string) => completedTopics.includes(name);

  const goTopic = (name: string) => {
    if (!playerName) return;
    if (inProgress && topicIsDone(name)) return;
    if (inProgress && !lockedTopics.includes(name)) return;
    if (!inProgress) startGame(topicNames);
    router.push(`/quiz?topic=${encodeURIComponent(name)}`);
  };

  const supabaseOk = isSupabaseConfigured();

  return (
    <div className="tt-screen relative flex min-h-dvh flex-col bg-tt-bg">
      <header className="tt-panel flex shrink-0 items-start justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 py-3.5 sm:items-center sm:gap-4 sm:py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="tt-heading-xl">Quiz Monster</h1>
          <p className="mt-1 max-w-[220px] font-body text-sm text-tt-subtle sm:max-w-none sm:text-sm">
            {inProgress ? "Game in progress. Finish all topics." : "Pick a topic to start a round."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {inProgress ? (
            <button
              type="button"
              className="tt-btn-ghost min-h-[42px] px-2.5 text-xs sm:min-h-[44px] sm:px-3 sm:text-sm"
              onClick={() => {
                if (confirm("Restart current game? This clears progress.")) resetGame();
              }}
            >
              Restart
            </button>
          ) : null}
          <Link
            href="/scores"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-transparent text-base text-white transition hover:border-tt-gold sm:h-11 sm:w-11 sm:text-lg"
            aria-label="High scores"
          >
            🏆
          </Link>
          <Link
            href="/settings"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-transparent text-base text-white transition hover:border-tt-gold sm:h-11 sm:w-11 sm:text-lg"
            aria-label="Topic manager"
          >
            ⚙️
          </Link>
        </div>
      </header>
      {!playerName && (
        <div className="tt-panel mx-4 mt-4 p-4 sm:mx-6">
          <p className="tt-label">Who is playing?</p>
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
            className="mt-3 min-h-[44px] w-full rounded-xl border border-white/10 bg-tt-surface-mid px-3 font-body text-sm text-white outline-none placeholder:text-tt-faint focus:border-tt-gold"
            placeholder="Guest name (required if choosing Guest)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </div>
      )}
      {inProgress && completedTopics.length === topicNames.length ? (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-[rgba(45,184,122,0.3)] bg-[rgba(45,184,122,0.12)] px-3 py-2.5 sm:mx-6">
          <p className="font-body text-sm text-tt-success">All topics completed. Start a fresh game anytime.</p>
          <button type="button" className="tt-btn-ghost min-h-[40px] px-3" onClick={resetGame}>
            New game
          </button>
        </div>
      ) : null}
      {!supabaseOk && (
        <div className="border-b border-[rgba(245,166,35,0.3)] bg-[rgba(245,166,35,0.12)] px-4 py-2.5 sm:px-6">
          <p className="font-body text-xs leading-snug text-tt-warning sm:text-sm">
            Optional: add Supabase in <code className="rounded bg-black/25 px-1">.env.local</code> to sync saved topics
            across devices.
          </p>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
        {loading ? (
          <div className="flex flex-1 items-center justify-center font-body text-sm text-tt-subtle">Loading topics…</div>
        ) : (
          <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-2.5 sm:max-w-2xl sm:gap-4 md:max-w-4xl md:grid-cols-3">
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

          </div>
        )}
      </main>
    </div>
  );
}
