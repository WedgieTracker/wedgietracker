import Image from "next/image";
import Link from "next/link";
export function LogoComponent() {
  return (
    <div className="flex items-center justify-center">
      <Link href="/">
        <Image
          src="/logo.svg"
          alt="Wedgietracker Logo"
          width={120}
          height={120}
          className="w-full max-w-[80px] md:max-w-[120px]"
        />
      </Link>
    </div>
  );
}
