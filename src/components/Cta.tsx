"use client";

import React, { useState } from "react";
import { useToast } from "~/hooks/use-toast";

interface CtaProps {
  links: {
    title: string;
    url: string;
  }[];
  variant?: "small" | "large";
}

export function Cta({ links, variant = "large" }: CtaProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { error?: string };

      if (response.ok) {
        toast({
          title: "Success!",
          description: "You've been subscribed to our newsletter.",
        });
        setEmail("");
      } else {
        throw new Error(data.error ?? "Something went wrong");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to subscribe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${variant === "small" ? "w-full" : "mx-auto max-w-2xl"}`}>
      <div
        className={`flex flex-col items-center gap-2 rounded-t-3xl bg-yellow py-6 ${
          variant === "small" ? "px-8" : "px-8"
        }`}
      >
        <h2 className="text-center text-lg font-bold text-darkpurple">
          Find out more
        </h2>

        <div className="flex w-full flex-col gap-1 sm:flex-row">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className={`order-2 whitespace-nowrap border-2 border-darkpurple bg-darkpurple px-4 text-center font-semibold uppercase tracking-wide text-yellow transition-colors hover:bg-yellow hover:text-darkpurple ${
                links.indexOf(link) === 0
                  ? "rounded-b-md rounded-t-xl sm:rounded-l-xl sm:rounded-r-md"
                  : links.indexOf(link) === links.length - 1
                    ? "rounded-b-xl rounded-t-md sm:rounded-l-md sm:rounded-r-xl"
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
      <div className="flex flex-col items-center gap-2 rounded-b-3xl border-t-2 border-darkpurple bg-yellow px-8 py-6">
        <p className="text-center text-xs text-darkpurple md:text-sm">
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
              className="focus:ring-none flex-1 rounded-t-xl border-2 border-darkpurple bg-darkpurple px-4 py-1 text-center text-yellow placeholder:text-yellow focus:outline-none sm:!rounded-l-xl sm:rounded-t-none sm:text-left"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-b-xl border-2 border-darkpurple bg-darkpurple px-6 py-1 font-black uppercase text-yellow transition-all duration-300 hover:bg-yellow hover:text-darkpurple disabled:cursor-not-allowed disabled:opacity-50 sm:!rounded-r-xl sm:rounded-b-none"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
