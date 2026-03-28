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
}

export function QuizQuestion({
  question,
  index,
  total,
  selectedIndex,
  revealed,
  onAnswer,
}: QuizQuestionProps) {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <p className="font-stat text-sm font-semibold uppercase tracking-widest text-tt-cyan/90">
        Question {index + 1} of {total}
      </p>
      <h2 className="font-stat text-xl font-bold leading-snug text-white sm:text-2xl">{question.question}</h2>
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
    </div>
  );
}
