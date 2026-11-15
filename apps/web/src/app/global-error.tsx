"use client";

// This screen replaces the root layout, so it brings the styles and font itself.
import "~/styles/globals.css";
import { Inter } from "next/font/google";
import { ErrorScreen } from "~/components/shared/ErrorScreen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-night font-sans">
        <main className="flex min-h-screen flex-col">
          <ErrorScreen code="500" title="Something went wrong">
            <button
              type="button"
              onClick={() => reset()}
              className="btn-sticker w-full max-w-60 px-6 text-base"
            >
              Try again
            </button>
          </ErrorScreen>
        </main>
      </body>
    </html>
  );
}
