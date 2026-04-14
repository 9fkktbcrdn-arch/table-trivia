const STORAGE_KEY = "table-trivia-flagged-questions";

export type FlaggedQuestionEntry = {
  topic: string;
  difficulty: string;
  question: string;
  answers: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation?: string;
  flaggedAt: string;
};

function readAll(): FlaggedQuestionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as FlaggedQuestionEntry[]) : [];
  } catch {
    return [];
  }
}

/** Append a flag locally (newest last). Keeps the last 100 entries. */
export function appendFlaggedQuestion(
  entry: Omit<FlaggedQuestionEntry, "flaggedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    const list = readAll();
    list.push({ ...entry, flaggedAt: new Date().toISOString() });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-100)));
  } catch {
    // ignore quota / privacy mode
  }
}
