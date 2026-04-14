import type { QuizQuestion } from "@/lib/types";

/** Bundled questions used only when `ANTHROPIC_API_KEY` is not set (local play / demo). */
export const OFFLINE_DEMO_QUESTIONS_RAW: QuizQuestion[] = [
  {
    question: "What do you get when you mix blue and yellow paint?",
    answers: ["Green", "Purple", "Orange", "Pink"],
    correctIndex: 0,
    questionDifficulty: "easy",
    explanation:
      "Blue and yellow are primary colors in subtractive paint mixing; combining them makes green, which is how we see many leaves and grass.",
  },
  {
    question: "How many legs does a typical dog have?",
    answers: ["Two", "Four", "Six", "Eight"],
    correctIndex: 1,
    questionDifficulty: "easy",
    explanation:
      "Mammals like dogs are tetrapods: they walk on four limbs, so a normal dog has four legs.",
  },
  {
    question: "Which planet is known as the Red Planet?",
    answers: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    questionDifficulty: "easy",
    explanation:
      "Mars looks reddish from Earth because iron-rich dust on its surface rusts, giving it a famous red tint in the night sky.",
  },
  {
    question: "What is the capital of France?",
    answers: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2,
    questionDifficulty: "medium",
    explanation:
      "Paris has been France’s political and cultural center for centuries and is designated as the national capital.",
  },
  {
    question: "How many days are in a regular year?",
    answers: ["360", "364", "365", "366"],
    correctIndex: 2,
    questionDifficulty: "medium",
    explanation:
      "The common calendar year (not a leap year) has 365 days, matching Earth’s orbit closely enough for everyday use.",
  },
  {
    question: "What do bees make?",
    answers: ["Milk", "Honey", "Maple syrup", "Juice"],
    correctIndex: 1,
    questionDifficulty: "easy",
    explanation:
      "Honeybees collect nectar and process it in the hive into honey, which they store as food.",
  },
  {
    question: "Which ocean is on the east coast of the United States?",
    answers: ["Pacific", "Indian", "Arctic", "Atlantic"],
    correctIndex: 3,
    questionDifficulty: "medium",
    explanation:
      "The U.S. East Coast borders the Atlantic Ocean; the Pacific lies along the west coast of the contiguous states.",
  },
  {
    question: "What is frozen water called?",
    answers: ["Steam", "Ice", "Fog", "Dew"],
    correctIndex: 1,
    questionDifficulty: "easy",
    explanation:
      "Below freezing, water solidifies into ice—the solid phase we see as cubes, icicles, and frost.",
  },
  {
    question: "How many sides does a triangle have?",
    answers: ["Two", "Three", "Four", "Five"],
    correctIndex: 1,
    questionDifficulty: "easy",
    explanation:
      "By definition a triangle is a polygon with exactly three edges and three vertices.",
  },
  {
    question: "Which shape is round like a ball?",
    answers: ["Cube", "Sphere", "Pyramid", "Cone"],
    correctIndex: 1,
    questionDifficulty: "hard",
    explanation:
      "A sphere is the 3D set of points equidistant from a center, like a ball—perfectly round in every direction.",
  },
];
