"use client";
import { useEffect, useState } from "react";

export function Counter({
  end,
  duration = 1000,
  format,
}: {
  end: number;
  duration?: number;
  format?: (n: number) => string | number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  // Hold the final number's width from the first frame, with equal-width
  // digits, so counting up doesn't nudge what's around it.
  const final = String(format ? format(end) : end);
  return (
    <span
      className="inline-block tabular-nums"
      style={{ minWidth: `${final.length}ch` }}
    >
      {format ? format(count) : count}
    </span>
  );
}
