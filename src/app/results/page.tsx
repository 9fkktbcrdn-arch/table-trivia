"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function difficultyLabel(d: string | null): string {
  switch (d) {
    case "noob":
      return "Noob";
    case "normal":
      return "Normal";
    case "grandmaster":
      return "Grand Master";
    default:
      return d ?? "—";
  }
}

function scoreMessage(scoreRatio: number): string {
  if (scoreRatio >= 0.95) return "Perfect score — legend at the table!";
  if (scoreRatio >= 0.8) return "Outstanding! The whole table is impressed.";
  if (scoreRatio >= 0.6) return "Solid round — seconds, anyone?";
  if (scoreRatio >= 0.4) return "Not bad! A little more gravy next time.";
  return "Tough round — challenge accepted for a rematch?";
}

function ResultsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const rawScore = params.get("score");
  const rawPoints = params.get("points");
  const rawMaxPoints = params.get("maxPoints");
  const topic = params.get("topic");
  const difficulty = params.get("difficulty");
  const score = rawScore != null ? Number.parseInt(rawScore, 10) : NaN;
  const points = rawPoints != null ? Number.parseInt(rawPoints, 10) : NaN;
  const maxPoints = rawMaxPoints != null ? Number.parseInt(rawMaxPoints, 10) : NaN;
  const scoreRatio = !Number.isNaN(points) && !Number.isNaN(maxPoints) && maxPoints > 0 ? points / maxPoints : score / 10;

  if (
    !topic ||
    Number.isNaN(score) ||
    score < 0 ||
    score > 10 ||
    Number.isNaN(points) ||
    Number.isNaN(maxPoints) ||
    points < 0 ||
    maxPoints <= 0
  ) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col items-center justify-center gap-4 bg-tt-bg px-4">
        <p className="font-body text-lg text-zinc-400">Nothing to show yet.</p>
        <Link href="/" className="tt-btn-primary min-h-[48px] px-6">
          Home
        </Link>
      </div>
    );
  }

  const playAgain = () => {
    router.push(`/quiz?topic=${encodeURIComponent(topic)}&difficulty=${difficulty ?? "normal"}&ts=${Date.now()}`);
  };

  return (
    <div className="tt-screen flex min-h-dvh flex-col items-center justify-center bg-tt-bg bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,121,249,0.12),transparent)] px-4 pb-10 pt-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-tt-border bg-tt-surface/95 p-8 text-center shadow-xl"
      >
        <p className="font-stat text-sm uppercase tracking-[0.2em] text-tt-magenta/90">Results</p>
        <h1 className="mt-2 font-stat text-4xl font-bold text-white sm:text-5xl">
          {points} / {maxPoints} pts <span aria-hidden>🎉</span>
        </h1>
        <p className="mt-2 font-body text-zinc-400">{score} correct out of 10 questions</p>
        <p className="mt-4 font-body text-lg leading-relaxed text-zinc-300">{scoreMessage(scoreRatio)}</p>
        <p className="mt-2 font-body text-sm text-zinc-500">
          {topic} · {difficultyLabel(difficulty)}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="tt-btn-primary min-h-[52px] flex-1 sm:max-w-[200px]" onClick={playAgain}>
            Play Again
          </button>
          <Link href="/" className="tt-btn-secondary flex min-h-[52px] flex-1 items-center justify-center sm:max-w-[200px]">
            New Topic
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-tt-bg font-body text-zinc-500">Loading…</div>
      }
    >
      <ResultsInner />
    </Suspense>
  );
}
