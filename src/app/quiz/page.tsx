"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { DifficultySelector } from "@/components/DifficultySelector";
import { QuizLoading } from "@/components/QuizLoading";
import { QuizQuestion as QuizQuestionView } from "@/components/QuizQuestion";
import { saveScore } from "@/lib/db";
import type { QuizQuestion, TriviaDifficulty } from "@/lib/types";
import { useTriviaStore } from "@/store/trivia-store";

function QuizFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const topic = params.get("topic");
  const difficultyParam = params.get("difficulty") as TriviaDifficulty | null;
  const replayNonce = params.get("ts");
  const gameMode = useTriviaStore((s) => s.gameMode);

  const [difficulty, setDifficulty] = useState<TriviaDifficulty | null>(difficultyParam);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctTotal, setCorrectTotal] = useState(0);

  useEffect(() => {
    if (difficultyParam && ["noob", "normal", "grandmaster"].includes(difficultyParam)) {
      setDifficulty(difficultyParam);
    } else {
      setDifficulty(null);
    }
  }, [difficultyParam]);

  const fetchQuiz = useCallback(async () => {
    if (!topic || !difficulty) return;
    setLoading(true);
    setError(null);
    setQuestions([]);
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setCorrectTotal(0);
    void replayNonce;
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty }),
      });
      const data = (await res.json()) as { questions?: QuizQuestion[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Couldn't generate questions, try again.");
        return;
      }
      if (!data.questions || data.questions.length !== 10) {
        setError("Couldn't generate questions, try again.");
        return;
      }
      setQuestions(data.questions);
    } catch {
      setError("Couldn't generate questions, try again.");
    } finally {
      setLoading(false);
    }
  }, [topic, difficulty, replayNonce]);

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
    if (!questions[idx] || revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === questions[idx].correctIndex) {
      setCorrectTotal((c) => c + 1);
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
    await saveScore({
      topic,
      difficulty,
      score: correctTotal,
      mode: gameMode,
    });
    router.push(
      `/results?score=${correctTotal}&topic=${encodeURIComponent(topic)}&difficulty=${difficulty}&mode=${gameMode}`,
    );
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
  const feedback =
    revealed && selected !== null
      ? selected === q.correctIndex
        ? "Nice!"
        : "Not quite!"
      : null;

  return (
    <div className="tt-screen flex min-h-dvh flex-col bg-tt-bg px-4 pb-8 pt-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/" className="tt-btn-ghost min-h-[48px] min-w-[48px] px-2 text-lg">
          ←
        </Link>
        <p className="truncate font-body text-sm text-zinc-500">{displayTopic}</p>
        <span className="w-12" />
      </div>

      <motion.div
        key={idx}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <QuizQuestionView
          question={q}
          index={idx}
          total={10}
          selectedIndex={selected}
          revealed={revealed}
          onAnswer={onPickAnswer}
        />

        {feedback && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-4 font-stat text-xl font-bold ${feedback === "Nice!" ? "text-tt-lime" : "text-tt-amber"}`}
          >
            {feedback}
          </motion.p>
        )}

        {revealed && (
          <div className="mt-auto pt-6">
            <button type="button" className="tt-btn-primary min-h-[52px] w-full sm:max-w-md" onClick={() => void onNext()}>
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
