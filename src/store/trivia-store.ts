import { create } from "zustand";
import type { GameMode } from "@/lib/types";

/** Lightweight session prefs; quiz flow uses URL search params as primary state. */
interface TriviaStore {
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
}

export const useTriviaStore = create<TriviaStore>((set) => ({
  gameMode: "standard",
  setGameMode: (m) => set({ gameMode: m }),
}));
