"use client";

import Link from "next/link";
import { LogoComponent } from "~/components/shared/Logo";
import { useMenu } from "~/context/MenuContext";
import { CircleMenu } from "./CircleMenu";

export function Header() {
  const { isMenuOpen, setIsMenuOpen } = useMenu();

  return (
    <>
      <header
        className={`fixed top-0 z-70 h-auto w-full backdrop-blur-xs transition-all duration-300`}
        style={{
          backgroundImage:
            "radial-gradient(transparent 0.5px, rgb(var(--darkpurple-rgb)) 0.5px) ",
          backgroundSize: "4px 4px",
          WebkitMaskImage: !isMenuOpen
            ? "linear-gradient(rgb(0, 0, 0) 80%, rgba(0, 0, 0, 0) 100%)"
            : "linear-gradient(rgb(0, 0, 0) 100%, rgba(0, 0, 0, 0) 100%)",
          maskImage: !isMenuOpen
            ? "linear-gradient(rgb(0, 0, 0) 80%, rgba(0, 0, 0, 0) 100%)"
            : "linear-gradient(rgb(0, 0, 0) 100%, rgba(0, 0, 0, 0) 100%)",
          height: isMenuOpen ? "100svh" : "auto",
        }}
      >
        <div className="grid h-16 grid-cols-3 items-center px-4 md:h-20 md:px-8">
          {/* Left column */}
          <div className="justify-self-start">
            <Link
              href="/support-us"
              className={`btn-sticker btn-sticker-sm wt-nudge mb-0.5 gap-1.5 px-2.5 text-[11px] tracking-wider uppercase md:px-3 md:text-xs ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-4 overflow-visible"
                fill="none"
              >
                <g stroke="#9a5cf5" strokeWidth="1.8" strokeLinecap="round">
                  <path className="wt-steam" d="M9.5 6c-1-1 1-1.6 0-2.6" />
                  <path className="wt-steam" d="M13.5 6c-1-1 1-1.6 0-2.6" />
                </g>
                <rect x="5" y="14" width="12" height="7" fill="#6b3a1f" />
                <rect
                  x="5"
                  y="8"
                  width="12"
                  height="13"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Support
            </Link>
          </div>

          {/* Center column - Logo */}
          <div className="justify-self-center">
            <div
              className={`flex items-center transition-opacity duration-300 ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            >
              <LogoComponent />
            </div>
          </div>

          {/* Right column - Menu button */}
          <div className="justify-self-end">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative z-60 flex flex-col gap-1 md:gap-1.5"
              aria-label="Toggle menu"
            >
              <span
                className={`h-0.5 w-5 transition-transform md:w-6 ${isMenuOpen ? "bg-darkpurple translate-y-[300%] rotate-45 md:translate-y-[400%]" : "bg-white"}`}
              />
              <span
                className={`h-0.5 w-5 transition-opacity md:w-6 ${isMenuOpen ? "bg-darkpurple opacity-0" : "bg-white"}`}
              />
              <span
                className={`h-0.5 w-5 transition-transform md:w-6 ${isMenuOpen ? "bg-darkpurple -translate-y-[300%] -rotate-45 md:-translate-y-[400%]" : "bg-white"}`}
              />
            </button>
          </div>
        </div>
        <CircleMenu />
      </header>
      {/* add a spacer */}
      <div className="h-16 md:h-20" />
    </>
  );
}
