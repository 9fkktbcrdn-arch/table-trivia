import type { QuizQuestion } from "@/lib/types";

/** Bundled questions used only when `ANTHROPIC_API_KEY` is not set (local play / demo). */
export const OFFLINE_DEMO_QUESTIONS_RAW: QuizQuestion[] = [
  {
    question: "What do you get when you mix blue and yellow paint?",
    answers: ["Green", "Purple", "Orange", "Pink"],
    correctIndex: 0,
    questionDifficulty: "easy",
  },
  {
    question: "How many legs does a typical dog have?",
    answers: ["Two", "Four", "Six", "Eight"],
    correctIndex: 1,
    questionDifficulty: "easy",
  },
  {
    question: "Which planet is known as the Red Planet?",
    answers: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    questionDifficulty: "easy",
  },
  {
    question: "What is the capital of France?",
    answers: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2,
    questionDifficulty: "medium",
  },
  {
    question: "How many days are in a regular year?",
    answers: ["360", "364", "365", "366"],
    correctIndex: 2,
    questionDifficulty: "medium",
  },
  {
    question: "What do bees make?",
    answers: ["Milk", "Honey", "Maple syrup", "Juice"],
    correctIndex: 1,
    questionDifficulty: "easy",
  },
  {
    question: "Which ocean is on the east coast of the United States?",
    answers: ["Pacific", "Indian", "Arctic", "Atlantic"],
    correctIndex: 3,
    questionDifficulty: "medium",
  },
  {
    question: "What is frozen water called?",
    answers: ["Steam", "Ice", "Fog", "Dew"],
    correctIndex: 1,
    questionDifficulty: "easy",
  },
  {
    question: "How many sides does a triangle have?",
    answers: ["Two", "Three", "Four", "Five"],
    correctIndex: 1,
    questionDifficulty: "easy",
  },
  {
    question: "Which shape is round like a ball?",
    answers: ["Cube", "Sphere", "Pyramid", "Cone"],
    correctIndex: 1,
    questionDifficulty: "hard",
  },
];
