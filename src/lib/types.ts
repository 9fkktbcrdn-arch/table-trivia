export type TriviaDifficulty = "noob" | "normal" | "grandmaster";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export type GameMode = "standard" | "blitz";

export interface TopicRow {
  id: string;
  name: string;
  /** Optional HTTPS URL — shown as the topic tile background on the home screen. */
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface ScoreRow {
  id: string;
  topic: string;
  difficulty: string;
  score: number;
  mode: string;
  player_name: string | null;
  created_at: string;
}

export interface QuizQuestion {
  question: string;
  answers: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  questionDifficulty: QuestionDifficulty;
}

export interface GenerateQuizPayload {
  topic: string;
  difficulty: TriviaDifficulty;
}
