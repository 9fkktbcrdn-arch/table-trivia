"use client";

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

  const goTopic = (name: string) => {
    router.push(`/quiz?topic=${encodeURIComponent(name)}`);
  };

  const supabaseOk = isSupabaseConfigured();

  return (
    <div className="tt-screen relative flex min-h-dvh flex-col bg-tt-bg bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,238,0.1),transparent)]">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-tt-border/40 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="font-stat text-2xl font-bold tracking-tight text-white sm:text-3xl">Table Trivia</h1>
          <p className="mt-0.5 font-body text-sm text-zinc-500 sm:text-base">Pick a topic to start a round.</p>
        </div>
        <Link
          href="/settings"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tt-border/80 bg-tt-surface/90 text-lg text-tt-cyan transition hover:border-tt-cyan/50 hover:bg-tt-surface"
          aria-label="Topic manager"
        >
          ⚙️
        </Link>
      </header>

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
          <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-3 sm:max-w-xl sm:gap-4">
            {slots.map((row, idx) =>
              row ? (
                <div key={row.id} className="min-w-0">
                  <TopicCard
                    title={row.name}
                    imageUrl={row.image_url}
                    onClick={() => goTopic(row.name)}
                    variant="topic"
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
              <TopicCard title={GENERAL_TRIVIA_LABEL} onClick={() => goTopic(GENERAL_TRIVIA_LABEL)} variant="general" />
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
