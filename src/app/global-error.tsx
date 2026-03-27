"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-darkpurple">
        <div className="flex min-h-screen flex-col items-center justify-center text-white">
          <h1 className="text-6xl font-black text-yellow">500</h1>
          <p className="mt-4 text-xl text-pink">Something went wrong</p>
          <button
            onClick={() => reset()}
            className="mt-8 rounded-full border-2 border-yellow bg-yellow px-6 py-2 font-black uppercase text-darkpurple transition-all duration-300 hover:bg-transparent hover:text-yellow"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
