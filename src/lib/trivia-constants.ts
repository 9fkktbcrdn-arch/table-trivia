/** Sixth tile: bonus round with a random standalone topic. */
export const EXTRA_CREDIT_LABEL = "Extra Credit";

/** @deprecated Prefer EXTRA_CREDIT_LABEL — kept for saved browser state. */
export const GENERAL_TRIVIA_LABEL = EXTRA_CREDIT_LABEL;

export const LEGACY_GENERAL_TRIVIA_NAME = "General Trivia";

export const LOADING_MESSAGES = [
  "Cooking up questions…",
  "Summoning the quiz master…",
  "Sharpening pencils…",
  "Loading brain cells…",
  "Polishing buzzers…",
] as const;

export const LOADING_JOKES = [
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I would tell a chemistry joke, but I know I wouldn't get a reaction.",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "Why don't scientists trust atoms? Because they make up everything.",
  "I asked the librarian for books on paranoia. She whispered, 'They're right behind you.'",
] as const;

export const MODERATOR_CORRECT_QUIPS = [
  "Boom! You are dangerously well-informed.",
  "Correct. Somewhere, a game show host just nodded in respect.",
  "Nailed it. Your trivia powers are unsettling.",
  "Yep! That answer had main-character energy.",
  "Right again. Are you secretly writing the questions?",
] as const;

export const MODERATOR_WRONG_QUIPS = [
  "Oof. That answer bravely chose chaos.",
  "Swing and a miss, but bonus points for confidence.",
  "Not this time. The trivia gods remain unconvinced.",
  "Close-ish... in an alternate universe.",
  "Incorrect, but the dramatic effort was appreciated.",
] as const;
