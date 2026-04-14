"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { DifficultySelector } from "@/components/DifficultySelector";
import { QuizLoading } from "@/components/QuizLoading";
import { QuizQuestion as QuizQuestionView } from "@/components/QuizQuestion";
import { appendFlaggedQuestion } from "@/lib/flagged-questions";
import { saveScore } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { QuizQuestion, TriviaDifficulty } from "@/lib/types";
import { maxPointsForQuestions, pointsForQuestion } from "@/lib/scoring";
import { EXTRA_CREDIT_LABEL, MODERATOR_CORRECT_QUIPS, MODERATOR_WRONG_QUIPS } from "@/lib/trivia-constants";
import { useTriviaStore } from "@/store/trivia-store";

function QuizFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const topic = params.get("topic");
  const difficultyParam = params.get("difficulty") as TriviaDifficulty | null;
  const replayNonce = params.get("ts");
  const gameMode = useTriviaStore((s) => s.gameMode);
  const playerName = useTriviaStore((s) => s.playerName);
  const completeTopic = useTriviaStore((s) => s.completeTopic);
  const addUsage = useTriviaStore((s) => s.addUsage);
  const addRoundCost = useTriviaStore((s) => s.addRoundCost);
  const lockedTopics = useTriviaStore((s) => s.lockedTopics);
  const currentGameSeed = useTriviaStore((s) => s.currentGameSeed);

  const [difficulty, setDifficulty] = useState<TriviaDifficulty | null>(difficultyParam);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [moderatorQuip, setModeratorQuip] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [issueReportedForQuestion, setIssueReportedForQuestion] = useState(false);

  useEffect(() => {
    if (difficultyParam && ["noob", "normal", "grandmaster"].includes(difficultyParam)) {
      setDifficulty(difficultyParam);
    } else {
      setDifficulty(null);
    }
  }, [difficultyParam]);

  useEffect(() => {
    setIssueReportedForQuestion(false);
    setModeratorQuip(null);
  }, [idx]);

  const fetchQuiz = useCallback(async () => {
    if (!topic || !difficulty) return;
    setLoading(true);
    setError(null);
    setQuestions([]);
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setCorrectTotal(0);
    setPointsTotal(0);
    setModeratorQuip(null);
    setDemoMode(false);
    setIssueReportedForQuestion(false);
    void replayNonce;
    try {
      const isExtraCredit = topic.trim().toLowerCase() === EXTRA_CREDIT_LABEL.toLowerCase();
      const sessionTopics = lockedTopics.filter((t) => t.toLowerCase() !== EXTRA_CREDIT_LABEL.toLowerCase());
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          gameSeed: currentGameSeed,
          ...(isExtraCredit ? { sessionTopics } : {}),
        }),
      });
      const data = (await res.json()) as {
        questions?: QuizQuestion[];
        error?: string;
        hint?: string;
        demoMode?: boolean;
        inputTokens?: number;
        outputTokens?: number;
        estimatedCostUsd?: number;
      };
      if (!res.ok) {
        const parts = [data.error, data.hint].filter(Boolean);
        setError(parts.length ? parts.join(" ") : "Couldn't generate questions, try again.");
        return;
      }
      if (!data.questions || data.questions.length !== 10) {
        setError("Couldn't generate questions, try again.");
        return;
      }
      setQuestions(data.questions);
      setDemoMode(Boolean(data.demoMode));
      if (!data.demoMode) {
        addRoundCost(data.estimatedCostUsd ?? 0);
        if (!isSupabaseConfigured()) {
          addUsage(data.inputTokens ?? 0, data.outputTokens ?? 0, data.estimatedCostUsd ?? 0);
        }
      }
    } catch {
      setError("Couldn't generate questions, try again.");
    } finally {
      setLoading(false);
    }
  }, [topic, difficulty, replayNonce, addUsage, addRoundCost, lockedTopics, currentGameSeed]);

  useEffect(() => {
    if (!topic) return;
    if (!difficulty) return;
    void fetchQuiz();
  }, [topic, difficulty, fetchQuiz]);

  const onSelectDifficulty = (d: TriviaDifficulty) => {
    if (!topic) return;
    router.replace(`/quiz?topic=${encodeURIComponent(topic)}&difficulty=${d}`);
  };

  const onPickAnswer = (i: number) => {
    if (!topic || !questions[idx] || revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === questions[idx].correctIndex) {
      setModeratorQuip(MODERATOR_CORRECT_QUIPS[Math.floor(Math.random() * MODERATOR_CORRECT_QUIPS.length)] ?? "Nice!");
      setCorrectTotal((c) => c + 1);
      if (difficulty) {
        const extraCredit = topic.trim().toLowerCase() === EXTRA_CREDIT_LABEL.toLowerCase();
        setPointsTotal((p) =>
          p + pointsForQuestion(difficulty, questions[idx].questionDifficulty, { extraCredit }),
        );
      }
    } else {
      setModeratorQuip(MODERATOR_WRONG_QUIPS[Math.floor(Math.random() * MODERATOR_WRONG_QUIPS.length)] ?? "Not quite!");
    }
  };

  const onNext = async () => {
    if (!questions.length || !topic || !difficulty) return;
    if (idx < 9) {
      setIdx((n) => n + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    const extraCredit = topic.trim().toLowerCase() === EXTRA_CREDIT_LABEL.toLowerCase();
    const maxPoints = maxPointsForQuestions(difficulty, questions, { extraCredit });
    completeTopic(topic, pointsTotal, correctTotal, maxPoints);
    const state = useTriviaStore.getState();
    const normalizeTopic = (name: string) =>
      name.trim().toLowerCase() === "general trivia" ? EXTRA_CREDIT_LABEL.toLowerCase() : name.trim().toLowerCase();
    const expectedTopics = [...new Set(state.lockedTopics.map((t) => t.trim()).filter((t) => t.length > 0))];
    const completedNormalized = new Set(state.completedTopics.map(normalizeTopic));
    const completedExpectedCount = expectedTopics.filter((t) => completedNormalized.has(normalizeTopic(t))).length;
    const finished = expectedTopics.length >= 2 && completedExpectedCount >= expectedTopics.length;
    if (finished) {
      await saveScore({
        topic: "Full Game (6 topics)",
        difficulty: "session",
        score: state.totalPoints,
        mode: gameMode,
        playerName: playerName ?? "Guest",
      });
      router.push(
        `/results?game=1&points=${state.totalPoints}&maxPoints=${state.totalMaxPoints}&correct=${state.totalCorrect}&roundCost=${state.currentGameEstimatedCostUsd.toFixed(
          4,
        )}&player=${encodeURIComponent(
          state.playerName ?? "Guest",
        )}`,
      );
      return;
    }
    router.push(`/?completed=${encodeURIComponent(topic)}`);
  };

  if (!topic?.trim()) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
        <p className="font-body text-lg text-zinc-400">Missing topic.</p>
        <Link href="/" className="tt-btn-primary min-h-[48px] px-6">
          Home
        </Link>
      </div>
    );
  }
  if (!playerName) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
        <p className="font-body text-lg text-zinc-400">Pick a player first.</p>
        <Link href="/" className="tt-btn-primary min-h-[48px] px-6">
          Home
        </Link>
      </div>
    );
  }

  const displayTopic = topic;

  if (!difficulty) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 pb-8 pt-6 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="tt-btn-ghost min-h-[48px] min-w-[48px] px-2">
            ←
          </Link>
          <div>
            <p className="font-stat text-xs uppercase tracking-widest text-tt-cyan/80">Topic</p>
            <h1 className="font-stat text-2xl font-bold text-white">{displayTopic}</h1>
          </div>
        </div>
        <p className="mb-4 font-body text-lg text-zinc-400">Choose difficulty</p>
        <DifficultySelector onSelect={onSelectDifficulty} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 pt-8">
        <QuizLoading />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="tt-screen flex min-h-dvh flex-col items-center justify-center gap-6 bg-tt-bg px-4">
        <p className="text-center font-body text-lg text-tt-rose/95">{error ?? "Something went wrong."}</p>
        <button type="button" className="tt-btn-primary min-h-[48px] px-8" onClick={() => void fetchQuiz()}>
          Try again
        </button>
        <Link href="/" className="font-body text-tt-cyan underline">
          Home
        </Link>
      </div>
    );
  }

  const q = questions[idx];
  const isExtraCreditRound = displayTopic.trim().toLowerCase() === EXTRA_CREDIT_LABEL.toLowerCase();
  const perQuestionPoints = difficulty
    ? pointsForQuestion(difficulty, q.questionDifficulty, { extraCredit: isExtraCreditRound })
    : 0;
  const progressPct = ((idx + 1) / 10) * 100;
  const feedback =
    revealed && selected !== null
      ? selected === q.correctIndex
        ? (moderatorQuip ?? "Nice!")
        : (moderatorQuip ?? "Not quite!")
      : null;

  return (
    <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 pb-8 pt-5 sm:px-6">
      <div className="mb-4 rounded-2xl border border-tt-border/80 bg-tt-surface/75 p-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="tt-btn-ghost min-h-[44px] min-w-[44px] px-2 text-lg">
            ←
          </Link>
          <p className="truncate px-1 font-body text-sm text-zinc-300">{displayTopic}</p>
          <p className="font-stat text-xs uppercase tracking-wide text-zinc-400">{pointsTotal} pts</p>
        </div>
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between font-body text-xs text-zinc-500">
            <span>Question {idx + 1}/10</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-tt-bg/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-tt-cyan/90 to-tt-lime/80 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {demoMode && (
        <p className="mb-3 rounded-xl border border-amber-500/40 bg-amber-950/35 px-3 py-2 font-body text-sm text-amber-100/95">
          You&apos;re playing <strong>demo questions</strong> (no AI key). Add{" "}
          <code className="rounded bg-black/30 px-1">ANTHROPIC_API_KEY</code> to{" "}
          <code className="rounded bg-black/30 px-1">.env.local</code> for topic-specific AI quizzes.
        </p>
      )}

      <motion.div
        key={idx}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex min-h-0 flex-1 flex-col rounded-2xl border border-tt-border/70 bg-tt-surface/60 p-3 sm:p-4"
      >
        <QuizQuestionView
          question={q}
          index={idx}
          total={10}
          selectedIndex={selected}
          revealed={revealed}
          onAnswer={onPickAnswer}
          extraCredit={isExtraCreditRound}
          issueReported={issueReportedForQuestion}
          onReportIssue={() => {
            if (!topic || !difficulty) return;
            appendFlaggedQuestion({
              topic,
              difficulty,
              question: q.question,
              answers: q.answers,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
            });
            setIssueReportedForQuestion(true);
          }}
        />

        {feedback && (
          <div className="mt-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`font-stat text-xl font-bold ${feedback === "Nice!" ? "text-tt-lime" : "text-tt-amber"}`}
            >
              {feedback}
            </motion.p>
            <p className="mt-1 font-body text-sm text-zinc-400">
              {selected === q.correctIndex ? `+${perQuestionPoints} points` : `Worth ${perQuestionPoints} points`}
            </p>
          </div>
        )}

        {revealed && (
          <div className="sticky bottom-2 mt-4 border-t border-tt-border/30 bg-gradient-to-t from-tt-bg via-tt-bg/95 to-transparent pt-3">
            <button type="button" className="tt-btn-primary min-h-[52px] w-full" onClick={() => void onNext()}>
              {idx >= 9 ? "See Results" : "Next"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-tt-bg font-body text-zinc-500">Loading…</div>
      }
    >
      <QuizFlow />
    </Suspense>
  );
}
