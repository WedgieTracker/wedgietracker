import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-darkpurple text-white">
      <h1 className="text-6xl font-black text-yellow">404</h1>
      <p className="mt-4 text-xl text-pink">Page not found</p>
      <Link
        href="/"
        className="mt-8 rounded-full border-2 border-yellow bg-yellow px-6 py-2 text-button-text font-black uppercase text-darkpurple transition-all duration-300 hover:bg-darkpurple hover:text-yellow"
      >
        Go Home
      </Link>
    </div>
  );
}
