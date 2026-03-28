import { connection } from "next/server";
import Link from "next/link";
import { PageLayout } from "~/components/layout/PageLayout";

interface SearchParams {
  session_id?: string;
  coffee?: string;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
  const params = await searchParams;
  const sessionId = params.session_id;
  const coffee = params.coffee;
  return (
    <PageLayout showCircleMenu={false}>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-yellow mb-4 text-4xl font-bold">Thank You!</h1>
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
            <div className="bg-darkpurple-light mb-6 rounded-lg p-4">
              <p className="mb-2 text-sm text-white/60">Order ID</p>
              <p className="font-mono text-sm break-all text-white">
                {sessionId}
              </p>
            </div>
          )}

          {coffee === "true" ? (
            <p className="mb-8 text-sm text-white/80">
              We&apos;ve sent you a confirmation email. Please check your inbox
              (and spam/junk folder) for the donation details.
            </p>
          ) : (
            <p className="mb-8 text-sm text-white/80">
              We&apos;ve sent you a confirmation email. Please check your inbox
              (and spam/junk folder) for the order details.
            </p>
          )}

          <Link
            href="/store"
            className="bg-pink hover:bg-pink/80 rounded-lg px-8 py-4 font-bold text-white transition-all"
          >
            Return to Store
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
