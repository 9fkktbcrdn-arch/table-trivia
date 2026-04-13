import type { QuestionDifficulty, TriviaDifficulty } from "@/lib/types";

const POINTS_BY_SELECTED_DIFFICULTY: Record<TriviaDifficulty, Record<QuestionDifficulty, number>> = {
  noob: { easy: 1, medium: 2, hard: 3 },
  normal: { easy: 2, medium: 3, hard: 5 },
  grandmaster: { easy: 3, medium: 5, hard: 8 },
};

export function pointsForQuestion(selected: TriviaDifficulty, question: QuestionDifficulty): number {
  return POINTS_BY_SELECTED_DIFFICULTY[selected][question];
}

export function maxPointsForQuestions(
  selected: TriviaDifficulty,
  questions: Array<{ questionDifficulty: QuestionDifficulty }>,
): number {
  return questions.reduce((sum, q) => sum + pointsForQuestion(selected, q.questionDifficulty), 0);
}
