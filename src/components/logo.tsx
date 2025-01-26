import Logo from "../../public/logo.svg";
import Image from "next/image";
import Link from "next/link";
export function LogoComponent() {
  return (
    <div className="flex items-center justify-center">
      <Link href="/">
        <Image
          src={Logo as string}
          alt="Wedgietracker Logo"
          // width={100}
          // height={100}
          className="w-full max-w-[80px] md:max-w-[120px]"
        />
      </Link>
    </div>
  );
}
