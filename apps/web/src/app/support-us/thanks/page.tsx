import Link from "next/link";
import { Suspense } from "react";
import { recordCoffeeCheckout } from "~/server/coffees";
import { getBoardName, sessionIdFromClaim } from "~/server/coffee-board";
import { PageLayout } from "~/components/layout/PageLayout";
import { CoffeeNameForm } from "~/components/support/CoffeeNameForm";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Thank You",
  description: "Thanks for the coffee!",
});

type Params = Promise<{
  session_id?: string | string[];
  claim?: string | string[];
}>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

/**
 * Adds the coffees from the checkout Stripe sent us back from to this
 * season's scoreboard (once per checkout, so a refresh is safe), then asks
 * for a leaderboard name. With a claim link from the email instead, it asks
 * a past buyer to name the coffees they already bought.
 */
async function Thanks({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const claim = first(params.claim);
  const claimed = claim ? sessionIdFromClaim(claim) : null;
  const sessionId = claimed ?? first(params.session_id);

  let coffees: number | null = null;
  if (sessionId) {
    try {
      coffees = await recordCoffeeCheckout(sessionId);
    } catch (error) {
      console.error("Couldn't record a coffee checkout", error);
    }
  }
  const name = coffees && sessionId ? await getBoardName(sessionId) : null;

  return (
    <>
      <h1 className="text-cream mt-4 text-4xl font-black uppercase">
        {claimed ? "Claim your coffees" : "Thank you!"}
      </h1>
      <p className="mt-4 text-xl text-white">
        {claimed
          ? `Your ${coffees ?? ""} ${coffees === 1 ? "coffee is" : "coffees are"} on the leaderboard as Anonymous. Put your name on ${coffees === 1 ? "it" : "them"}, or leave ${coffees === 1 ? "it" : "them"} anonymous.`
          : "Thank you, that one will keep me going through the late games."}
      </p>
      {coffees && !claimed && (
        <p className="text-cream mt-3 text-base font-extrabold">
          +{coffees} {coffees === 1 ? "point" : "points"} for the coffees on
          this season&apos;s scoreboard.
        </p>
      )}
      {coffees && sessionId && (
        <CoffeeNameForm
          sessionId={claimed ? undefined : sessionId}
          claim={claimed ? claim : undefined}
          initialName={name}
        />
      )}
      {!claimed && (
        <p className="mt-6 mb-8 text-sm text-white/80">
          We&apos;ve sent you a confirmation email. If it isn&apos;t in your
          inbox, check the spam or junk folder.
        </p>
      )}
    </>
  );
}

export default function ThanksPage({ searchParams }: { searchParams: Params }) {
  return (
    <PageLayout>
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <p className="text-5xl" aria-hidden="true">
            ☕
          </p>
          <Suspense
            fallback={
              <h1 className="text-cream mt-4 text-4xl font-black uppercase">
                Thank you!
              </h1>
            }
          >
            <Thanks searchParams={searchParams} />
          </Suspense>
          <Link
            href="/support-us"
            className="bg-violet hover:bg-violet/80 mt-8 inline-block rounded-xl px-8 py-4 font-black text-white uppercase transition-all"
          >
            See the leaderboard
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
