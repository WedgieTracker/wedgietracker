"use client";

import { useEffect, useReducer, useRef, useMemo } from "react";

interface StatsPerWedgie {
  fga: number;
  possessions: number;
  games: number;
  minutes: number;
}

interface TypingStatsProps {
  stats: StatsPerWedgie;
}

type StatKey = keyof StatsPerWedgie;
const STATS_ORDER: StatKey[] = ["fga", "possessions", "games", "minutes"];

type State = { stat: StatKey; text: string };
type Action = { type: "text"; text: string } | { type: "next" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "text":
      return { stat: state.stat, text: action.text };
    case "next": {
      const i = STATS_ORDER.indexOf(state.stat);
      return {
        stat: STATS_ORDER[(i + 1) % STATS_ORDER.length]!,
        text: state.text,
      };
    }
  }
}

const INITIAL_STATE: State = { stat: "fga", text: "" };

export function TypingStats({ stats }: TypingStatsProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
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
      const value = stats[state.stat];
      if (isNaN(value)) {
        return `0 ${statLabels[state.stat]}`;
      }
      return `${value.toLocaleString()} ${statLabels[state.stat]}`;
    };

    const typeText = async () => {
      if (typingRef.current) return;
      typingRef.current = true;

      const targetText = getCurrentText();
      let tempText = state.text;

      // Clear the text
      for (let i = tempText.length; i >= 0; i--) {
        if (!typingRef.current) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
        tempText = tempText.slice(0, i);
        dispatch({ type: "text", text: tempText });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Type new text
      for (let i = 0; i <= targetText.length; i++) {
        if (!typingRef.current) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
        tempText = targetText.slice(0, i);
        dispatch({ type: "text", text: tempText });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Schedule next stat change
      cycleTimeoutRef.current = setTimeout(() => {
        dispatch({ type: "next" });
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
  }, [state.stat, stats, statLabels]);

  return (
    <div className="from-darkpurple-light to-darkpurple-lighter w-full max-w-xl rounded-b-xl bg-linear-to-b text-base text-white md:text-xl">
      <div className="relative flex min-h-18 flex-col items-center justify-center md:min-h-24">
        <span className="block font-bold">THAT IS A WEDGIE EVERY</span>
        <span className="text-xl font-black md:text-3xl">
          <span className="text-yellow">{state.text.split(" ")[0]}</span>{" "}
          <span className="text-pink font-bold">
            {state.text.split(" ").slice(1).join(" ")}
          </span>
          <span className="animate-blink mb-[-0.1em] ml-1 inline-block h-[1em] w-2 bg-white" />
        </span>
      </div>
    </div>
  );
}
