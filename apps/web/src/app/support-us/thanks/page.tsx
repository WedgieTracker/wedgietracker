import Link from "next/link";
import { PageLayout } from "~/components/layout/PageLayout";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Thank You",
  description: "Thanks for the coffee!",
});

export default function ThanksPage() {
  return (
    <PageLayout>
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <p className="text-5xl" aria-hidden="true">
            ☕
          </p>
          <h1 className="text-yellow mt-4 text-4xl font-black uppercase">
            Thank you!
          </h1>
          <p className="mt-4 text-xl text-white">
            Thank you, that one will keep me going through the late games.
          </p>
          <p className="mt-4 mb-8 text-sm text-white/80">
            We&apos;ve sent you a confirmation email. If it isn&apos;t in your
            inbox, check the spam or junk folder.
          </p>
          <Link
            href="/"
            className="bg-pink hover:bg-pink/80 rounded-xl px-8 py-4 font-black text-white uppercase transition-all"
          >
            Back to the wedgies
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
