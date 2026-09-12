import { useEffect, useRef, useState } from "react";

/**
 * Port of apps/web/src/components/ui/Counter.tsx - counts up to `end` over
 * `duration` using requestAnimationFrame, which React Native also provides.
 */
export function useCountUp(end: number, duration = 1000): number {
  const [count, setCount] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    let startTime: number | undefined;

    const animate = (currentTime: number) => {
      startTime ??= currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        frame.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    frame.current = requestAnimationFrame(animate);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [end, duration]);

  return count;
}
