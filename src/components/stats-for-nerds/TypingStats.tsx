"use client";

import { useEffect, useState, useRef, useMemo } from "react";

interface StatsPerWedgie {
  fga: number;
  possessions: number;
  games: number;
  minutes: number;
}

interface TypingStatsProps {
  stats: StatsPerWedgie;
}

export function TypingStats({ stats }: TypingStatsProps) {
  const [currentStat, setCurrentStat] = useState<keyof StatsPerWedgie>("fga");
  const [displayText, setDisplayText] = useState("");
  const typingRef = useRef<boolean>(false);
  const cycleTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  const statLabels = useMemo(
    () => ({
      fga: "FGA",
      possessions: "POSSESSIONS",
      games: "GAMES",
      minutes: "MINUTES PLAYED",
    }),
    [],
  );

  useEffect(() => {
    const getCurrentText = () => {
      const value = stats[currentStat];
      if (isNaN(value)) {
        return `0 ${statLabels[currentStat]}`;
      }
      return `${value.toLocaleString()} ${statLabels[currentStat]}`;
    };

    const typeText = async () => {
      if (typingRef.current) return;
      typingRef.current = true;

      const targetText = getCurrentText();
      let tempText = displayText;

      // Clear the text
      for (let i = tempText.length; i >= 0; i--) {
        if (!typingRef.current) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
        tempText = tempText.slice(0, i);
        setDisplayText(tempText);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Type new text
      for (let i = 0; i <= targetText.length; i++) {
        if (!typingRef.current) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
        tempText = targetText.slice(0, i);
        setDisplayText(tempText);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Schedule next stat change
      cycleTimeoutRef.current = setTimeout(() => {
        const statsArray = ["fga", "possessions", "games", "minutes"] as const;
        const currentIndex = statsArray.indexOf(currentStat);
        const nextIndex = (currentIndex + 1) % statsArray.length;
        setCurrentStat(statsArray[nextIndex]! as keyof StatsPerWedgie);
      }, 500);

      typingRef.current = false;
    };

    void typeText();

    return () => {
      typingRef.current = false;
      if (cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStat, stats, statLabels]);

  return (
    <div className="from-darkpurple-light to-darkpurple-lighter w-full max-w-xl rounded-b-xl bg-linear-to-b text-base text-white md:text-xl">
      <div className="relative flex min-h-18 flex-col items-center justify-center md:min-h-24">
        <span className="block font-bold">THAT IS A WEDGIE EVERY</span>
        <span className="text-xl font-black md:text-3xl">
          <span className="text-yellow">{displayText.split(" ")[0]}</span>{" "}
          <span className="text-pink font-bold">
            {displayText.split(" ").slice(1).join(" ")}
          </span>
          <span className="animate-blink mb-[-0.1em] ml-1 inline-block h-[1em] w-2 bg-white" />
        </span>
      </div>
    </div>
  );
}
