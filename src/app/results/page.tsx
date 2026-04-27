"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTriviaStore } from "@/store/trivia-store";

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
  const resetGame = useTriviaStore((s) => s.resetGame);
  const params = useSearchParams();
  const game = params.get("game") === "1";
  const rawScore = params.get("score");
  const rawPoints = params.get("points");
  const rawMaxPoints = params.get("maxPoints");
  const rawCorrect = params.get("correct");
  const rawRoundCost = params.get("roundCost");
  const player = params.get("player");
  const topic = params.get("topic");
  const difficulty = params.get("difficulty");
  const score = rawScore != null ? Number.parseInt(rawScore, 10) : NaN;
  const totalCorrect = rawCorrect != null ? Number.parseInt(rawCorrect, 10) : NaN;
  const roundCost = rawRoundCost != null ? Number.parseFloat(rawRoundCost) : NaN;
  const points = rawPoints != null ? Number.parseInt(rawPoints, 10) : NaN;
  const maxPoints = rawMaxPoints != null ? Number.parseInt(rawMaxPoints, 10) : NaN;
  const scoreRatio = !Number.isNaN(points) && !Number.isNaN(maxPoints) && maxPoints > 0 ? points / maxPoints : score / 10;

  if (!game && (
    !topic ||
    Number.isNaN(score) ||
    score < 0 ||
    score > 10 ||
    Number.isNaN(points) ||
    Number.isNaN(maxPoints) ||
    points < 0 ||
    maxPoints <= 0
  )) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col items-center justify-center gap-4 bg-tt-bg px-4">
        <p className="tt-text-sm">Nothing to show yet.</p>
        <Link href="/" className="tt-btn-primary min-h-[48px] px-6">
          Home
        </Link>
      </div>
    );
  }

  const playAgain = () => {
    if (game || !topic) return;
    router.push(`/quiz?topic=${encodeURIComponent(topic)}&difficulty=${difficulty ?? "normal"}&ts=${Date.now()}`);
  };

  return (
    <div className="tt-screen flex min-h-dvh flex-col items-center justify-center bg-tt-bg px-4 pb-10 pt-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="tt-panel w-full max-w-md p-8 text-center"
      >
        <p className="tt-label">{game ? "Game Complete" : "Results"}</p>
        <h1 className="mt-2 font-stat text-[24px] font-bold tracking-[-0.01em] text-white sm:text-[28px]">
          {points} / {maxPoints} pts <span aria-hidden>🎉</span>
        </h1>
        <p className="tt-text-sm mt-2">{game ? `${totalCorrect} correct across all topics` : `${score} correct out of 10 questions`}</p>
        <p className="tt-text-md mt-4">{scoreMessage(scoreRatio)}</p>
        <p className="tt-text-sm mt-2">
          {game ? `${player ?? "Guest"} · Full game` : `${topic} · ${difficultyLabel(difficulty)}`}
        </p>
        {game && !Number.isNaN(roundCost) ? (
          <p className="tt-text-xs mt-1">AI cost this game: ${roundCost.toFixed(4)}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!game ? (
            <button type="button" className="tt-btn-primary min-h-[52px] flex-1 sm:max-w-[200px]" onClick={playAgain}>
              Play Again
            </button>
          ) : null}
          <Link
            href="/"
            className="tt-btn-secondary flex min-h-[52px] flex-1 items-center justify-center sm:max-w-[200px]"
            onClick={() => resetGame()}
          >
            {game ? "New Game" : "New Topic"}
          </Link>
          {game ? (
            <Link href="/scores" className="tt-btn-primary flex min-h-[52px] flex-1 items-center justify-center sm:max-w-[200px]">
              High Scores
            </Link>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="tt-text-sm flex min-h-dvh items-center justify-center bg-tt-bg">Loading…</div>
      }
    >
      <ResultsInner />
    </Suspense>
  );
}
