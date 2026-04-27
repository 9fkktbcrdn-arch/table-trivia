"use client";

import { AnswerButton } from "@/components/AnswerButton";
import type { QuizQuestion as Q } from "@/lib/types";

interface QuizQuestionProps {
  question: Q;
  index: number;
  total: number;
  selectedIndex: number | null;
  revealed: boolean;
  onAnswer: (index: number) => void;
  /** Optional: lightweight QA — user flags a bad question (handled by parent). */
  onReportIssue?: () => void;
  issueReported?: boolean;
  extraCredit?: boolean;
}

export function QuizQuestion({
  question,
  index,
  total,
  selectedIndex,
  revealed,
  onAnswer,
  onReportIssue,
  issueReported,
  extraCredit,
}: QuizQuestionProps) {
  const difficultyLabel =
    question.questionDifficulty === "easy" ? "Easy" : question.questionDifficulty === "medium" ? "Medium" : "Hard";
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-tt-subtle">
        Question {index + 1} of {total}
      </p>
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-tt-subtle">
        {extraCredit ? `Extra Credit · ${difficultyLabel}` : difficultyLabel}
      </p>
      <h2 className="font-stat text-[16px] font-bold leading-snug text-white">{question.question}</h2>
      <div className="grid grid-cols-1 gap-3">
        {question.answers.map((label, i) => {
          let state: "idle" | "correct" | "incorrect" | "revealed-correct" = "idle";
          if (revealed) {
            if (selectedIndex === i && i === question.correctIndex) state = "correct";
            else if (i === question.correctIndex) state = "revealed-correct";
            else if (selectedIndex === i) state = "incorrect";
          }
          return (
            <AnswerButton
              key={i}
              index={i}
              label={label}
              state={state}
              disabled={revealed}
              onClick={() => onAnswer(i)}
            />
          );
        })}
      </div>

      {revealed &&
      selectedIndex !== null &&
      selectedIndex !== question.correctIndex &&
      question.explanation.trim() ? (
        <div
          className="rounded-xl border border-[rgba(212,160,23,0.2)] bg-tt-surface-mid px-4 py-3"
          role="note"
          aria-live="polite"
        >
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-tt-subtle">Why it&apos;s right</p>
          <p className="mt-1.5 font-body text-sm leading-relaxed text-white">{question.explanation}</p>
        </div>
      ) : null}

      {onReportIssue ? (
        <div className="mt-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={onReportIssue}
            disabled={issueReported}
            className="font-body text-xs text-tt-subtle underline decoration-tt-faint underline-offset-2 transition hover:text-white disabled:cursor-default disabled:no-underline disabled:text-tt-faint"
          >
            {issueReported ? "Saved on this device for review" : "Problem with this question?"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
