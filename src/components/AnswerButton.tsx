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
      ? "border-tt-lime bg-tt-lime/20 text-white shadow-[0_0_24px_rgba(139,245,141,0.45)]"
      : state === "incorrect"
        ? "border-tt-rose bg-tt-rose/20 text-parchment/90 shadow-[0_10px_22px_rgba(244,63,94,0.24)]"
        : state === "revealed-correct"
          ? "border-tt-lime/90 bg-tt-lime/25 text-white shadow-[0_10px_22px_rgba(139,245,141,0.3)]"
          : "border-tt-border bg-gradient-to-b from-[#1b3bb3] to-[#112b7f] text-parchment hover:-translate-y-0.5 hover:border-tt-amber/80 hover:brightness-110 hover:shadow-[0_12px_24px_rgba(12,30,100,0.45)]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${styles}`}
    >
      <span className="font-stat text-tt-amber">{letter}.</span>{" "}
      <span className="text-parchment">{label}</span>
    </button>
  );
}
