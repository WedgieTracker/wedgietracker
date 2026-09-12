"use client";

import { useEffect, useState, useRef } from "react";
import Confetti from "react-confetti";

export function Wave({
  fillPercentage,
  showConfetti: enableConfetti = false,
}: {
  fillPercentage: number;
  showConfetti?: boolean;
}) {
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
      className="bg-pink absolute bottom-0 left-0 z-0 w-full transition-all duration-1000"
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
            </defs>
            <g className="parallax">
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="0"
                fill="rgba(255,0,255,0.7)"
              />
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="3"
                fill="rgba(255,0,255,0.5)"
              />
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="5"
                fill="rgba(255,0,255,0.3)"
              />
              <use
                xlinkHref="#gentle-wave"
                x="48"
                y="7"
                fill="rgb(255 0 255)"
              />
            </g>
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
              colors={["#eaff00", "#ff03ff", "#180138", "#542299", "#efff40"]}
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
