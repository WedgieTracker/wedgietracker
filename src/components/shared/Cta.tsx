"use client";

import React from "react";
import { useNewsletterSubscription } from "~/hooks/use-newsletter";

interface CtaProps {
  links: {
    title: string;
    url: string;
  }[];
  variant?: "small" | "large";
}

export function Cta({ links, variant = "large" }: CtaProps) {
  const { email, setEmail, loading, handleSubmit } =
    useNewsletterSubscription();

  return (
    <div className={`${variant === "small" ? "w-full" : "mx-auto max-w-2xl"}`}>
      <div
        className={`bg-yellow flex flex-col items-center gap-2 rounded-t-3xl py-6 ${
          variant === "small" ? "px-8" : "px-8"
        }`}
      >
        <h2 className="text-darkpurple text-center text-lg font-bold">
          Find out more
        </h2>

        <div className="flex w-full flex-col gap-1 sm:flex-row">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className={`border-darkpurple bg-darkpurple text-yellow hover:bg-yellow hover:text-darkpurple order-2 border-2 px-4 text-center font-semibold tracking-wide whitespace-nowrap uppercase transition-colors ${
                links.indexOf(link) === 0
                  ? "rounded-t-xl rounded-b-md sm:rounded-l-xl sm:rounded-r-md"
                  : links.indexOf(link) === links.length - 1
                    ? "rounded-t-md rounded-b-xl sm:rounded-l-md sm:rounded-r-xl"
                    : "rounded-md"
              } ${variant === "small" ? "py-1 text-sm" : "py-1 text-base"}`}
              style={{
                flex: link.title.length,
              }}
            >
              {link.title}
            </a>
          ))}
        </div>
      </div>
      <div className="border-darkpurple bg-yellow flex flex-col items-center gap-2 rounded-b-3xl border-t-2 px-8 py-6">
        <p className="text-darkpurple text-center text-xs md:text-sm">
          Subscribe to our newsletter to get updates on the latest wedgies and
          other news.
        </p>
        <div className="mt-2 w-full max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-1 sm:flex-row"
            autoComplete="on"
            spellCheck="false"
          >
            <input
              type="email"
              value={email}
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="off"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              className="focus:ring-none border-darkpurple bg-darkpurple text-yellow placeholder:text-yellow flex-1 rounded-t-xl border-2 px-4 py-1 text-center focus:outline-hidden sm:rounded-t-none sm:rounded-l-xl! sm:text-left"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="border-darkpurple bg-darkpurple text-yellow hover:bg-yellow hover:text-darkpurple rounded-b-xl border-2 px-6 py-1 font-black uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-r-xl! sm:rounded-b-none"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
