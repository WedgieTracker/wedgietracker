"use client";

import Link from "next/link";
import { LogoComponent } from "~/components/shared/Logo";
import { CoffeeCup } from "~/components/support/CoffeeCup";
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
              <CoffeeCup className="h-[18px] w-[14px]" />
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
