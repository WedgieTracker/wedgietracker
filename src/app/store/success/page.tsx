import Link from "next/link";
import { Header } from "~/components/layout/Header";
import { MenuProvider } from "~/context/MenuContext";
import { Footer } from "~/components/layout/Footer";

interface SearchParams {
  session_id?: string;
  coffee?: string;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const coffee = params.coffee;
  return (
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-4xl font-bold text-yellow">Thank You!</h1>
            {coffee === "true" ? (
              <p className="mb-4 text-xl text-white">
                Your coffee donation has been confirmed.
              </p>
            ) : (
              <p className="mb-4 text-xl text-white">
                Your order has been confirmed.
              </p>
            )}

            {sessionId && coffee !== "true" && (
              <div className="mb-6 rounded-lg bg-darkpurple-light p-4">
                <p className="mb-2 text-sm text-white/60">Order ID</p>
                <p className="break-all font-mono text-sm text-white">
                  {sessionId}
                </p>
              </div>
            )}

            {coffee === "true" ? (
              <p className="mb-8 text-sm text-white/80">
                We&apos;ve sent you a confirmation email. Please check your
                inbox (and spam/junk folder) for the donation details.
              </p>
            ) : (
              <p className="mb-8 text-sm text-white/80">
                We&apos;ve sent you a confirmation email. Please check your
                inbox (and spam/junk folder) for the order details.
              </p>
            )}

            <Link
              href="/store"
              className="rounded-lg bg-pink px-8 py-4 font-bold text-white transition-all hover:bg-pink/80"
            >
              Return to Store
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    </MenuProvider>
  );
}
