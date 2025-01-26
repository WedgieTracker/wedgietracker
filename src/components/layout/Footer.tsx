"use client";

import Link from "next/link";
import { useState } from "react";
import { socialLinks } from "./SocialIcons";

export function Footer() {
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);

  return (
    <div className="w-full bg-darkpurple-darker px-4 py-4 md:px-8 lg:px-8">
      <div className="flex flex-col-reverse items-center justify-between gap-2 sm:flex-row md:flex-row">
        <div className="block items-center gap-8 text-center sm:text-left lg:flex lg:flex-row">
          {/* social networks */}
          <div className="mb-1 flex flex-row items-center gap-2 lg:mb-0">
            {socialLinks.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 text-lg text-black transition-colors hover:bg-white"
                onMouseEnter={() => setHoveredSocial(social.href)}
                onMouseLeave={() => setHoveredSocial(null)}
              >
                {typeof social.icon === "function"
                  ? social.icon(hoveredSocial === social.href, true)
                  : social.icon}
              </a>
            ))}
          </div>

          <span className="mr-4 whitespace-nowrap text-xs text-white lg:ml-0">
            © 2025 WedgieTracker
          </span>

          <Link
            href="/privacy"
            className="text-xs text-white/50 underline transition-all duration-300 hover:text-white"
          >
            Privacy
          </Link>
        </div>
        <div className="flex flex-col items-center gap-2 sm:items-end lg:flex-row lg:items-center lg:gap-8">
          <span className="text-xs text-white/50">
            Inspired by{" "}
            <a
              target="_blank"
              href="https://twitter.com/NoDunksInc"
              className="text-white/80 underline transition-all duration-300 hover:text-white"
            >
              @NoDunksInc
            </a>
          </span>
          <span className="text-xs text-white/50">
            Created by{" "}
            <a
              target="_blank"
              href="https://www.riccardo.lol"
              className="text-white/80 underline transition-all duration-300 hover:text-white"
            >
              riccardo.lol
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
