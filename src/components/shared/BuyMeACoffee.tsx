"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "~/trpc/react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export function BuyMeACoffee() {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const checkoutMutation = api.donations.createCheckoutSession.useMutation({
    onSuccess: async (sessionId) => {
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      setLoading(false);
    },
  });

  const handleDonate = async () => {
    setLoading(true);
    checkoutMutation.mutate({
      quantity,
    });
  };

  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-xl bg-yellow p-4 px-2 text-center md:p-8 lg:p-8">
      <h3 className="text-xl font-bold text-darkpurple">
        ☕ Buy us a coffee ☕
      </h3>
      <p className="text-sm text-darkpurple md:text-base">
        If you like what we&apos;re doing, please consider{" "}
        <strong>buying us a coffee!</strong>
        <br />
        It helps us keep the website running and allows us to continue working
        on it.
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="rounded-l-lg bg-pink/20 px-2 py-1 text-pink hover:bg-pink/30"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="flex items-center gap-0 bg-pink px-2 py-1 font-bold text-white">
            <span className="font-normal text-white opacity-40">×</span>
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="rounded-r-lg bg-pink/20 px-2 py-1 text-pink hover:bg-pink/30"
          >
            +
          </button>
        </div>
        <span className="text-darkpurple">
          Total:{" "}
          <span className="rounded-lg border border-darkpurple px-2 py-1 font-bold text-darkpurple">
            ${quantity * 1}
          </span>
        </span>
      </div>
      <button
        onClick={handleDonate}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-pink px-4 py-2 font-bold text-white transition-all hover:bg-pink/80 disabled:opacity-50"
      >
        {loading ? (
          "Processing..."
        ) : (
          <>
            <span>Buy {quantity > 1 ? `${quantity} coffees` : "a coffee"}</span>
          </>
        )}
      </button>
    </div>
  );
}
