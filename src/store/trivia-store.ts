import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GameMode } from "@/lib/types";

type PlayerCode = "KJC" | "CHC" | "GUEST";

interface TriviaStore {
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  playerCode: PlayerCode | null;
  playerName: string | null;
  setPlayer: (code: PlayerCode, guestName?: string) => void;
  inProgress: boolean;
  lockedTopics: string[];
  completedTopics: string[];
  totalPoints: number;
  totalCorrect: number;
  totalMaxPoints: number;
  currentGameEstimatedCostUsd: number;
  startGame: (topics: string[]) => void;
  completeTopic: (topic: string, points: number, correct: number, maxPoints: number) => void;
  resetGame: () => void;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number;
  addUsage: (inputTokens: number, outputTokens: number, estimatedCostUsd: number) => void;
  resetUsage: () => void;
}

export const useTriviaStore = create<TriviaStore>()(
  persist(
    (set) => ({
      gameMode: "standard",
      setGameMode: (m) => set({ gameMode: m }),
      playerCode: null,
      playerName: null,
      setPlayer: (code, guestName) =>
        set({
          playerCode: code,
          playerName: code === "GUEST" ? guestName?.trim() || "Guest" : code,
        }),
      inProgress: false,
      lockedTopics: [],
      completedTopics: [],
      totalPoints: 0,
      totalCorrect: 0,
      totalMaxPoints: 0,
      currentGameEstimatedCostUsd: 0,
      startGame: (topics) =>
        set({
          inProgress: true,
          lockedTopics: topics,
          completedTopics: [],
          totalPoints: 0,
          totalCorrect: 0,
          totalMaxPoints: 0,
          currentGameEstimatedCostUsd: 0,
        }),
      completeTopic: (topic, points, correct, maxPoints) =>
        set((state) => {
          if (state.completedTopics.includes(topic)) return state;
          return {
            completedTopics: [...state.completedTopics, topic],
            totalPoints: state.totalPoints + points,
            totalCorrect: state.totalCorrect + correct,
            totalMaxPoints: state.totalMaxPoints + maxPoints,
          };
        }),
      resetGame: () =>
        set({
          inProgress: false,
          lockedTopics: [],
          completedTopics: [],
          totalPoints: 0,
          totalCorrect: 0,
          totalMaxPoints: 0,
          currentGameEstimatedCostUsd: 0,
        }),
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalEstimatedCostUsd: 0,
      addUsage: (inputTokens, outputTokens, estimatedCostUsd) =>
        set((state) => ({
          totalInputTokens: state.totalInputTokens + Math.max(0, Math.floor(inputTokens)),
          totalOutputTokens: state.totalOutputTokens + Math.max(0, Math.floor(outputTokens)),
          totalEstimatedCostUsd: state.totalEstimatedCostUsd + Math.max(0, estimatedCostUsd),
          currentGameEstimatedCostUsd: state.inProgress
            ? state.currentGameEstimatedCostUsd + Math.max(0, estimatedCostUsd)
            : state.currentGameEstimatedCostUsd,
        })),
      resetUsage: () =>
        set({
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalEstimatedCostUsd: 0,
        }),
    }),
    {
      name: "table-trivia-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        gameMode: state.gameMode,
        playerCode: state.playerCode,
        playerName: state.playerName,
        inProgress: state.inProgress,
        lockedTopics: state.lockedTopics,
        completedTopics: state.completedTopics,
        totalPoints: state.totalPoints,
        totalCorrect: state.totalCorrect,
        totalMaxPoints: state.totalMaxPoints,
        currentGameEstimatedCostUsd: state.currentGameEstimatedCostUsd,
        totalInputTokens: state.totalInputTokens,
        totalOutputTokens: state.totalOutputTokens,
        totalEstimatedCostUsd: state.totalEstimatedCostUsd,
      }),
    },
  ),
);
