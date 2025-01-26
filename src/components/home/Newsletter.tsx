"use client";

import { useState } from "react";
import { useToast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";

export function Newsletter() {
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
    <div
      className={cn(
        "w-full max-w-2xl rounded-xl bg-yellow p-4 md:p-8",
        loading &&
          "animate-pulse-slow pointer-events-none animate-pulse opacity-50",
      )}
    >
      <div className="mb-3 text-center md:mb-4 md:text-left lg:text-left">
        <h3 className="min-w-none !mt-0 mb-0 text-2xl font-black uppercase !text-darkpurple">
          Stay Updated
        </h3>
        <p className="mb-0 mt-1 font-bold leading-tight text-darkpurple/80">
          Subscribe to get the latest wedgies updates and more.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-1 md:flex-row"
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
          className="focus:ring-none flex-1 rounded-t-xl border-2 border-darkpurple bg-darkpurple px-4 py-2 text-center text-yellow placeholder:text-yellow focus:outline-none md:!rounded-l-xl md:rounded-t-none md:text-left lg:text-left"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-b-xl border-2 border-darkpurple bg-darkpurple px-4 py-2 text-xs font-black uppercase text-yellow transition-all duration-300 hover:bg-yellow hover:text-darkpurple disabled:cursor-not-allowed disabled:opacity-50 md:!rounded-r-xl md:rounded-b-none md:px-6 md:py-2 md:text-base md:text-sm"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
