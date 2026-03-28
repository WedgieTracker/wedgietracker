"use client";

import Link from "next/link";
import { useState } from "react";
import { useMenu } from "~/context/MenuContext";
import { socialLinks } from "./SocialIcons";

const menuItems = [
  { href: "/stats-for-nerds", label: "STATS FOR NERDS" },
  { href: "/all-wedgies", label: "ALL WEDGIES ARCHIVE" },
  { href: "/standings", label: "PLAYERS/TEAMS STANDINGS" },
  { href: "/seasons-history", label: "SEASONS HISTORY" },
  { href: "/store", label: "OG WEDGIE T-SHIRT" },
  { href: "/blog", label: "BLOG" },
];

export function CircleMenu() {
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);

  return (
    <div
      className={`fixed top-0 left-0 z-50 h-svh w-screen ${
        isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Dark overlay */}
      {/* <div
        className={`fixed left-0 top-0 z-50 h-svh w-screen transition-all duration-300 ${
          isMenuOpen
            ? "opacity-100 backdrop-blur-xs"
            : "pointer-events-none opacity-0 backdrop-blur-[0px]"
        }`}
        onClick={() => setIsMenuOpen(false)}
        style={{
          backgroundImage:
            "radial-gradient(transparent 1px, rgb(var(--darkpurple-rgb)) 1px)",
          backgroundSize: "2px 2px",
        }}
      /> */}

      {/* Menu */}
      <div
        className={`fixed top-0 right-0 z-50 h-svh w-screen transition-opacity duration-300 ${
          isMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* Yellow circle background */}
        <div
          className="fixed top-0 right-0 h-[800px] w-[800px] translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e5ff00] transition-transform duration-500 ease-in-out md:top-5"
          style={{
            transform: isMenuOpen
              ? "translate(35%, -50%) scale(1)"
              : "translate(50%, -50%) scale(0)",
          }}
        />

        {/* Menu items */}
        <nav
          className={`fixed top-16 right-0 flex items-center justify-center transition-opacity delay-200 duration-300 md:pt-1 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col items-end gap-2 pr-5 text-right md:pr-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-md hover:text-pink font-bold text-black transition-colors md:text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Social links */}
            <div
              className={`mt-2 text-xs font-bold text-black uppercase transition-opacity delay-300 duration-300 ${
                isMenuOpen ? "opacity-100" : "opacity-0"
              }`}
            >
              Find us on
              <div className="mt-1 -mr-2 flex gap-2 md:gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:bg-darkpurple rounded-full p-2 text-lg text-black transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                    onMouseEnter={() => setHoveredSocial(social.href)}
                    onMouseLeave={() => setHoveredSocial(null)}
                  >
                    {typeof social.icon === "function"
                      ? social.icon(hoveredSocial === social.href)
                      : social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
