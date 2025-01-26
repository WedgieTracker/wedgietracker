"use client";

import { GoogleAnalytics as GA } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import CookieConsent from "./CookieConsent";

declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>,
    ) => void;
  }
}

interface GoogleAnalyticsProps {
  gaId: string;
}

function GoogleAnalyticsContent({ gaId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    setHasConsent(consent === "accepted");
  }, []);

  useEffect(() => {
    if (hasConsent && pathname) {
      console.log("page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: pathname,
      });
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: pathname,
      });
    }
  }, [pathname, searchParams, hasConsent]);

  if (typeof window === "undefined") return null;
  // skip if node is not prod
  // if (process.env.NODE_ENV !== "production") return null;

  const handleAccept = () => {
    setHasConsent(true);
  };

  const handleDecline = () => {
    setHasConsent(false);
    // Optionally, you can clear existing cookies here
  };

  return (
    <>
      {hasConsent && <GA gaId={gaId} />}
      <CookieConsent onAccept={handleAccept} onDecline={handleDecline} />
    </>
  );
}

export default function GoogleAnalytics(props: GoogleAnalyticsProps) {
  return (
    <Suspense>
      <GoogleAnalyticsContent {...props} />
    </Suspense>
  );
}
