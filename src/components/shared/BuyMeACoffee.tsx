"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function BuyMeACoffee() {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const checkoutMutation = api.donations.createCheckoutSession.useMutation({
    onSuccess: (url) => {
      if (url) window.location.href = url;
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
    <div className="bg-yellow flex w-full flex-col items-center gap-3 rounded-xl p-4 px-2 text-center md:p-8 lg:p-8">
      <h3 className="text-darkpurple text-xl font-bold">
        ☕ Buy us a coffee ☕
      </h3>
      <p className="text-darkpurple text-sm md:text-base">
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
            className="bg-pink/20 text-pink hover:bg-pink/30 rounded-l-lg px-2 py-1"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="bg-pink flex items-center gap-0 px-2 py-1 font-bold text-white">
            <span className="font-normal text-white opacity-40">×</span>
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="bg-pink/20 text-pink hover:bg-pink/30 rounded-r-lg px-2 py-1"
          >
            +
          </button>
        </div>
        <span className="text-darkpurple">
          Total:{" "}
          <span className="border-darkpurple text-darkpurple rounded-lg border px-2 py-1 font-bold">
            ${quantity * 1}
          </span>
        </span>
      </div>
      <button
        onClick={handleDonate}
        disabled={loading}
        className="bg-pink hover:bg-pink/80 flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-white transition-all disabled:opacity-50"
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
