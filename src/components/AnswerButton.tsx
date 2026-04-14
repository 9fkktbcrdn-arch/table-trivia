"use client";

interface AnswerButtonProps {
  label: string;
  index: number;
  onClick: () => void;
  state: "idle" | "correct" | "incorrect" | "revealed-correct";
  disabled: boolean;
}

export function AnswerButton({ label, index, onClick, state, disabled }: AnswerButtonProps) {
  const letter = String.fromCharCode(65 + index);
  const base =
    "min-h-[52px] w-full rounded-xl border-2 px-4 py-3 text-left font-body text-lg font-medium leading-snug transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-tt-cyan/45 focus-visible:ring-offset-2 focus-visible:ring-offset-tt-bg sm:min-h-[56px] sm:text-xl";

  const styles =
    state === "correct"
      ? "border-tt-lime bg-tt-lime/20 text-white shadow-[0_0_20px_rgba(163,230,53,0.35)]"
      : state === "incorrect"
        ? "border-tt-rose bg-tt-rose/15 text-parchment/90 shadow-[0_8px_18px_rgba(244,63,94,0.18)]"
        : state === "revealed-correct"
          ? "border-tt-lime/90 bg-tt-lime/25 text-white shadow-[0_8px_18px_rgba(163,230,53,0.2)]"
          : "border-tt-border bg-tt-surface/90 text-parchment hover:-translate-y-0.5 hover:border-tt-cyan/60 hover:bg-tt-surface hover:shadow-[0_10px_20px_rgba(15,23,42,0.35)]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${styles}`}
    >
      <span className="font-stat text-tt-cyan/90">{letter}.</span>{" "}
      <span className="text-parchment">{label}</span>
    </button>
  );
}
