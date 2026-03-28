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
          <h1 className="text-yellow text-6xl font-black">500</h1>
          <p className="text-pink mt-4 text-xl">Something went wrong</p>
          <button
            onClick={() => reset()}
            className="border-yellow bg-yellow text-darkpurple hover:text-yellow mt-8 rounded-full border-2 px-6 py-2 font-black uppercase transition-all duration-300 hover:bg-transparent"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
