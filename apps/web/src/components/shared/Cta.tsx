"use client";

import Link from "next/link";
import { useNewsletterSubscription } from "~/hooks/use-newsletter";

interface CtaProps {
  links: {
    title: string;
    url: string;
  }[];
}

/** Links to the other pages, then the newsletter sign-up, on a cream card. */
export function Cta({ links }: CtaProps) {
  const { email, setEmail, loading, handleSubmit } =
    useNewsletterSubscription();

  return (
    <div className="bg-cream text-night @container flex h-full w-full flex-col rounded-[22px] p-5 shadow-[0_12px_28px_rgb(5_2_20/0.45)] md:p-6">
      <h2 className="text-[22px] leading-none font-black tracking-[-0.03em]">
        Find out more
      </h2>
      <div className="mt-4 mb-6 flex flex-col gap-2.5 @lg:flex-row">
        {links.map((link) => (
          <Link
            key={link.url}
            href={link.url}
            className="btn-sticker min-h-12 flex-1 px-3 text-center text-[14.5px] whitespace-nowrap [--sticker-off:4px]"
          >
            {link.title}
          </Link>
        ))}
      </div>

      <div className="border-night/20 mt-auto border-t-2 border-dashed pt-5">
        <p className="text-night/75 text-center text-[13.5px] font-bold">
          Subscribe to our newsletter to get updates
          <br className="hidden @sm:inline" /> on the latest wedgies and other
          news.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          autoComplete="on"
          spellCheck="false"
        >
          <label className="sr-only" htmlFor="cta-email">
            Email
          </label>
          <input
            id="cta-email"
            type="email"
            value={email}
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="off"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            disabled={loading}
            className="bg-night text-cream placeholder:text-cream/50 focus-visible:outline-violet min-h-12 min-w-0 flex-1 rounded-xl px-4 text-[15px] font-bold outline-none focus-visible:outline-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-sticker min-h-12 px-5 text-[14.5px] [--sticker-off:4px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}
