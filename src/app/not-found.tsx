import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-darkpurple flex min-h-screen flex-col items-center justify-center text-white">
      <h1 className="text-yellow text-6xl font-black">404</h1>
      <p className="text-pink mt-4 text-xl">Page not found</p>
      <Link
        href="/"
        className="border-yellow bg-yellow text-button-text text-darkpurple hover:bg-darkpurple hover:text-yellow mt-8 rounded-full border-2 px-6 py-2 font-black uppercase transition-all duration-300"
      >
        Go Home
      </Link>
    </div>
  );
}
