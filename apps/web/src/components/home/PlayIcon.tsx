/** A rounded play triangle, nudged right so it looks centred in a circle. */
export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{ marginLeft: "0.1em" }}
    >
      <path
        d="M7 4.5v15l13-7.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The gradient play button used on wedgie cards. */
export function PlayButton({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`bg-glow grid shrink-0 place-items-center rounded-full text-[#fff6de] shadow-[0_3px_8px_rgb(122_95_240/0.3)] ${
        size === "lg" ? "size-10" : "size-[30px]"
      }`}
    >
      <PlayIcon
        className={`drop-shadow-[0_1px_1.5px_rgb(30_12_80/0.55)] ${
          size === "lg" ? "size-4" : "size-[13px]"
        }`}
      />
    </span>
  );
}
