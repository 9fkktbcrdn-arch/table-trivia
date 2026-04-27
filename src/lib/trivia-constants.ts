/** Sixth tile: bonus round with a random standalone topic. */
export const EXTRA_CREDIT_LABEL = "Extra Credit";

/** @deprecated Prefer EXTRA_CREDIT_LABEL — kept for saved browser state. */
export const GENERAL_TRIVIA_LABEL = EXTRA_CREDIT_LABEL;

export const LEGACY_GENERAL_TRIVIA_NAME = "General Trivia";

export const EXTRA_CREDIT_RANDOM_TOPIC_POOL = [
  "Classic Movies",
  "Volcanoes",
  "Ancient Egypt",
  "Ocean Creatures",
  "Basketball Legends",
  "Famous Inventors",
  "Space Missions",
  "World Landmarks",
  "Dinosaurs",
  "Mythical Creatures",
  "Music Through Decades",
  "Extreme Weather",
  "Famous Paintings",
  "Airplanes & Flight",
  "Great Explorers",
  "Islands of the World",
  "Olympic History",
  "Human Body Facts",
  "Wild Cats",
  "Superstructures",
] as const;

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
  "I tried to write a joke about broken pencils, but there was no point.",
  "I only know 25 letters of the alphabet. I don't know y.",
  "Why did the math book look sad? Too many problems.",
  "I told my computer I needed a break. It said, 'No problem, I'll freeze.'",
  "What do you call fake spaghetti? An impasta.",
  "Why did the bicycle fall over? It was two-tired.",
  "What do you call cheese that isn't yours? Nacho cheese.",
  "I used to play piano by ear. Now I use my hands.",
  "What do you call a belt made of watches? A waist of time.",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one.",
  "Why did the cookie go to the doctor? It felt crummy.",
  "Did you hear about the restaurant on the moon? Great food, no atmosphere.",
  "Why did the tomato blush? It saw the salad dressing.",
  "I bought shoes from a drug dealer. I don't know what he laced them with, but I was tripping all day.",
  "Why can't you trust stairs? They're always up to something.",
  "I told a joke about construction, but I'm still working on it.",
  "How do you organize a space party? You planet.",
  "Why did the music teacher need a ladder? To reach high notes.",
  "I used to be addicted to soap, but I'm clean now.",
  "Why did the student eat his homework? The teacher said it was a piece of cake.",
  "Why did the astronaut break up with her boyfriend? She needed space.",
  "I told my plants a joke. They were rooted in silence.",
  "Why did the stadium get so hot? All the fans left.",
  "I’m reading a book on anti-gravity. It’s impossible to put down.",
  "Why did the banana go to the doctor? It wasn’t peeling well.",
  "Why did the computer go to therapy? Too many bytes from the past.",
  "What do you call a fish with no eyes? Fsh.",
  "Why did the calendar apply for a job? Its days were numbered.",
  "I tried to catch fog yesterday. Mist.",
  "Why was the geometry book so confident? It had all the right angles.",
  "How do trees get online? They log in.",
  "I used to hate facial hair, but then it grew on me.",
  "Why did the orange stop rolling down the hill? It ran out of juice.",
  "What’s a skeleton’s least favorite room? The living room.",
  "Why did the coffee file a police report? It got mugged.",
  "What do you call a very small valentine? A valen-tiny.",
  "Why did the moon skip dinner? It was already full.",
  "Why do seagulls fly over the sea? Because if they flew over the bay, they’d be bagels.",
  "What did one wall say to the other wall? I’ll meet you at the corner.",
  "Why did the phone wear glasses? It lost its contacts.",
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
