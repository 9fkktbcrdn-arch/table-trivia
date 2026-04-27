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
    "min-h-[52px] w-full rounded-xl border px-3.5 py-2.5 text-left font-body text-sm font-medium leading-snug transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-tt-gold focus-visible:ring-offset-2 focus-visible:ring-offset-tt-bg";

  const styles =
    state === "correct"
      ? "border-tt-success bg-[rgba(45,184,122,0.16)] text-white"
      : state === "incorrect"
        ? "border-tt-error bg-[rgba(232,64,64,0.16)] text-white"
        : state === "revealed-correct"
          ? "border-tt-success bg-[rgba(45,184,122,0.12)] text-white"
          : "border-white/10 bg-tt-surface-mid text-white hover:border-tt-gold";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${styles}`}
    >
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(212,160,23,0.15)] font-body text-[12px] font-semibold text-tt-gold">
        {letter}
      </span>
      <span className="text-white">{label}</span>
    </button>
  );
}
