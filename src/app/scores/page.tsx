"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getHighScores } from "@/lib/db";
import type { ScoreRow } from "@/lib/types";

export default function HighScoresPage() {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const scores = await getHighScores(30);
      if (!cancelled) {
        setRows(scores);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 pb-8 pt-6 sm:px-6">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="tt-btn-ghost min-h-[48px] min-w-[48px] px-2">
          ←
        </Link>
        <div>
          <h1 className="font-stat text-2xl font-bold text-white">High Scores</h1>
          <p className="font-body text-sm text-zinc-500">Best total game scores.</p>
        </div>
      </header>
      {loading ? <p className="text-zinc-500">Loading…</p> : null}
      {!loading && rows.length === 0 ? <p className="text-zinc-500">No scores yet.</p> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((row, idx) => (
          <li key={row.id} className="flex items-center justify-between rounded-xl border border-tt-border bg-tt-surface/90 px-3 py-2">
            <div className="min-w-0">
              <p className="font-stat text-sm text-white">
                #{idx + 1} {row.player_name ?? "Guest"}
              </p>
              <p className="truncate font-body text-xs text-zinc-500">{row.topic}</p>
            </div>
            <p className="font-stat text-lg text-tt-cyan">{row.score}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
