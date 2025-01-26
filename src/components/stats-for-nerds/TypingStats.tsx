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
  const cycleTimeoutRef = useRef<NodeJS.Timeout>();

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
      return `${stats[currentStat].toLocaleString()} ${statLabels[currentStat]}`;
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
  }, [currentStat, stats, statLabels]);

  return (
    <div className="w-full max-w-xl rounded-b-xl bg-gradient-to-b from-darkpurple-light to-darkpurple-lighter text-base text-white md:text-xl">
      <div className="relative flex min-h-[4.5rem] flex-col items-center justify-center md:min-h-[6rem]">
        <span className="block font-bold">THAT IS A WEDGIE EVERY</span>
        <span className="text-xl font-black md:text-3xl">
          <span className="text-yellow">{displayText.split(" ")[0]}</span>{" "}
          <span className="font-bold text-pink">
            {displayText.split(" ").slice(1).join(" ")}
          </span>
          <span className="mb-[-0.1em] ml-1 inline-block h-[1em] w-2 animate-blink bg-white" />
        </span>
      </div>
    </div>
  );
}
