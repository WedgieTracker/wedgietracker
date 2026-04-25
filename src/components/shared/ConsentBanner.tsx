"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // GTM expects the arguments object, not an array
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function updateConsent(granted: boolean) {
  gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
  });
}

interface ConsentBannerProps {
  requiresConsent: boolean;
}

export default function ConsentBanner({ requiresConsent }: ConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Banner only renders in regions that legally require explicit opt-in.
    // Elsewhere, defaults are 'granted' via the head script (layout.tsx).
    if (!requiresConsent) return;
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, [requiresConsent]);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    updateConsent(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    updateConsent(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="inverted border-darkpurple-lighter bg-darkpurple-lighter/70 text-foreground fixed right-0 bottom-2 left-0 z-50 mx-auto max-w-[340px] rounded-lg border-2 px-4 py-4 shadow-lg backdrop-blur-xs sm:max-w-[550px] sm:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className={`text-center text-xs font-bold text-white sm:text-left`}>
          We like 🍪🍪, would you like to share yours?
          <Link
            href="/privacy"
            className="text-accent mt-0.5 block text-xs text-white hover:opacity-80"
          >
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="hover:text-darkpurple rounded-md border border-white px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-all duration-300 hover:bg-white"
          >
            No thanks
          </button>
          <button
            onClick={handleAccept}
            className="border-yellow bg-yellow text-darkpurple hover:text-yellow rounded-md border px-4 py-2 text-sm font-bold whitespace-nowrap uppercase transition-all duration-300 hover:bg-transparent"
          >
            I&apos;m in!
          </button>
        </div>
      </div>
    </div>
  );
}
