"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // GTM reads each pushed item as an [command, target, params] tuple
  window.dataLayer.push(args);
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
    <div className="bg-night/90 border-violet/45 fixed right-0 bottom-3 left-0 z-50 mx-auto w-[calc(100%-24px)] max-w-[340px] rounded-[22px] border px-5 py-4 shadow-[0_14px_30px_rgb(5_2_20/0.6)] backdrop-blur-xs sm:max-w-[560px] sm:px-6">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-cream text-center text-[13.5px] leading-snug font-bold sm:text-left">
          We like 🍪🍪, would you like to share yours?
          <Link
            href="/privacy"
            className="text-cream/70 decoration-cream/40 hover:text-cream mt-1 block text-xs underline underline-offset-4"
          >
            Privacy policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="border-cream/35 text-cream hover:border-cream hover:bg-cream/10 focus-visible:outline-cream min-h-10 rounded-xl border-2 px-4 text-[13.5px] font-black whitespace-nowrap transition-colors duration-150 focus-visible:outline-2"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="btn-sticker btn-sticker-sm min-h-10 px-4 text-[13.5px] whitespace-nowrap"
          >
            I&apos;m in!
          </button>
        </div>
      </div>
    </div>
  );
}
