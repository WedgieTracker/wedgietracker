import { useId } from "react";

/**
 * The takeaway coffee cup: a cream cup with a lid and the badge gradient on
 * its sleeve. `full` shows coffee inside; `steam` curls up above it.
 */
export function CoffeeCup({
  className,
  full = false,
  steam = true,
}: {
  className?: string;
  full?: boolean;
  steam?: boolean;
}) {
  const id = `cup${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 120 160"
      aria-hidden="true"
      className={`overflow-visible ${className ?? ""}`}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4769c5" />
          <stop offset=".5" stopColor="#36378d" />
          <stop offset="1" stopColor="#502394" />
        </linearGradient>
      </defs>
      {steam && (
        <g
          fill="none"
          stroke="rgb(240 225 182 / 0.7)"
          strokeWidth="5"
          strokeLinecap="round"
        >
          <path className="wt-cup-steam" d="M48 18c-6-8 6-10 0-18" />
          <path className="wt-cup-steam" d="M60 14c-6-8 6-10 0-18" />
          <path className="wt-cup-steam" d="M72 18c-6-8 6-10 0-18" />
        </g>
      )}
      <path
        d="M28 40 L92 40 L84 148 Q60 154 36 148 Z"
        fill={full ? "#6b3a1f" : "#f0e1b6"}
      />
      <path d="M30 70 L90 70 L87 112 L33 112 Z" fill={`url(#${id}-g)`} />
      <text
        x="60"
        y="99"
        textAnchor="middle"
        fontStyle="italic"
        fontWeight="900"
        fontSize="26"
        fill="#f0e1b6"
      >
        W
      </text>
      <path
        d="M28 40 L92 40 L84 148 Q60 154 36 148 Z"
        fill="none"
        stroke="#2a1660"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <rect
        x="22"
        y="28"
        width="76"
        height="14"
        rx="5"
        fill="#f0e1b6"
        stroke="#2a1660"
        strokeWidth="5"
      />
      <rect
        x="36"
        y="21"
        width="48"
        height="9"
        rx="3"
        fill="#f0e1b6"
        stroke="#2a1660"
        strokeWidth="4"
      />
    </svg>
  );
}
