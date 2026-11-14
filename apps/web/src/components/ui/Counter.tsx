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

  // The final value sits invisibly underneath and sets the exact size, with
  // the counting value laid over it, so counting up never moves anything.
  const final = format ? format(end) : end;
  return (
    <span className="inline-grid justify-items-center tabular-nums [&>*]:[grid-area:1/1]">
      <span aria-hidden="true" className="invisible">
        {final}
      </span>
      <span>{format ? format(count) : count}</span>
    </span>
  );
}
