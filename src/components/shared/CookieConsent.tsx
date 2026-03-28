"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function CookieConsent({
  onAccept,
  onDecline,
}: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookieConsent");
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="inverted fixed bottom-2 left-0 right-0 z-50 mx-auto max-w-[340px] rounded-lg border-2 border-darkpurple-lighter bg-darkpurple-lighter/70 px-4 py-4 text-foreground shadow-lg backdrop-blur-sm sm:max-w-[550px] sm:px-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className={`text-center text-xs font-bold text-white sm:text-left`}>
          We like 🍪🍪, would you like to share yours?
          <Link
            href="/privacy"
            className="mt-0.5 block text-xs text-accent text-white hover:opacity-80"
          >
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="whitespace-nowrap rounded-md border border-white px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white hover:text-darkpurple"
          >
            No thanks
          </button>
          <button
            onClick={handleAccept}
            className="whitespace-nowrap rounded-md border border-yellow bg-yellow px-4 py-2 text-sm font-bold uppercase text-darkpurple transition-all duration-300 hover:bg-transparent hover:text-yellow"
          >
            I&apos;m in!
          </button>
        </div>
      </div>
    </div>
  );
}
