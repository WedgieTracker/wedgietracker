"use client";

import { useEffect, useId, useState, useRef } from "react";
import Confetti from "react-confetti";

export function Wave({
  fillPercentage,
  showConfetti: enableConfetti = false,
}: {
  fillPercentage: number;
  showConfetti?: boolean;
}) {
  // Colons from useId are not safe inside url(#...) references.
  const waveId = `wave${useId().replace(/:/g, "")}`;
  const [currentHeight, setCurrentHeight] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [confettiVisible, setConfettiVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enableConfetti) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    setConfettiVisible(fillPercentage === 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [fillPercentage, enableConfetti]);

  useEffect(() => {
    setCurrentHeight(0);
    const id = setTimeout(() => setCurrentHeight(fillPercentage), 100);
    return () => clearTimeout(id);
  }, [fillPercentage]);

  return (
    <div
      ref={enableConfetti ? containerRef : undefined}
      className="bg-glow-x absolute bottom-0 left-0 z-0 w-full transition-[height] duration-1000"
      style={{ height: `${currentHeight}%` }}
    >
      <div className="absolute bottom-full left-0 z-0 h-[50px] w-full overflow-hidden transition-all duration-1000">
        <div className="wave-container absolute bottom-0 left-0 w-full">
          <svg
            className="waves"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 24 150 28"
            preserveAspectRatio="none"
            shapeRendering="auto"
          >
            <defs>
              <path
                id="gentle-wave"
                d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
              />
              {/*
                The front wave drifts sideways, so its gradient is painted on a
                still rectangle and the moving wave only masks it. That keeps it
                lined up with the fill below.
              */}
              <linearGradient
                id={`${waveId}-glow`}
                gradientUnits="userSpaceOnUse"
                x1="0"
                x2="150"
                y1="0"
                y2="0"
              >
                <stop offset="0" stopColor="#5f84e6" />
                <stop offset="0.5" stopColor="#7b6bf0" />
                <stop offset="1" stopColor="#a65ff5" />
              </linearGradient>
              <mask
                id={`${waveId}-front`}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="150"
                height="60"
              >
                <g className="parallax">
                  <use xlinkHref="#gentle-wave" x="48" y="0" fill="none" />
                  <use xlinkHref="#gentle-wave" x="48" y="3" fill="none" />
                  <use xlinkHref="#gentle-wave" x="48" y="5" fill="none" />
                  <use xlinkHref="#gentle-wave" x="48" y="7" fill="white" />
                </g>
              </mask>
            </defs>
            <g className="parallax">
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="0"
                fill="rgb(95 132 230 / 0.4)"
              />
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="3"
                fill="rgb(166 95 245 / 0.3)"
              />
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="5"
                fill="rgb(123 107 240 / 0.2)"
              />
            </g>
            <rect
              x="0"
              y="0"
              width="150"
              height="60"
              fill={`url(#${waveId}-glow)`}
              mask={`url(#${waveId}-front)`}
            />
          </svg>
        </div>
      </div>
      {enableConfetti &&
        confettiVisible &&
        dimensions.width > 0 &&
        dimensions.height > 0 && (
          <div className="absolute inset-0 z-0 h-full w-full">
            <Confetti
              width={dimensions.width}
              height={dimensions.height}
              numberOfPieces={150}
              gravity={0.05}
              colors={["#f0e1b6", "#9a5cf5", "#5f84e6", "#ff6fd8", "#ffffff"]}
              drawShape={(ctx) => {
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, 2 * Math.PI);
                ctx.fill();
              }}
            />
          </div>
        )}
    </div>
  );
}
