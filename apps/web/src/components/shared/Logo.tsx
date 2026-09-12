import Link from "next/link";
export function LogoComponent() {
  return (
    <div className="flex items-center justify-center">
      <Link href="/">
        <img
          src="/logo.svg"
          alt="Wedgietracker Logo"
          className="w-full max-w-[80px] md:max-w-[120px]"
        />
      </Link>
    </div>
  );
}
