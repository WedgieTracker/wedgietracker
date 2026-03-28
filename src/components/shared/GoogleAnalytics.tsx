"use client";

// import Script from "next/script";
// import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import CookieConsent from "./CookieConsent";
import { GoogleTagManager } from "@next/third-parties/google";

interface GoogleAnalyticsProps {
  gaId: string; // GTM container ID
}

function GoogleAnalyticsContent({ gaId }: GoogleAnalyticsProps) {
  // const pathname = usePathname();
  // const searchParams = useSearchParams();
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    setHasConsent(consent === "accepted");
  }, []);

  // Initialize GTM once
  // useEffect(() => {
  //   if (typeof window !== "undefined" && !isGtmInitialized) {
  //     window.dataLayer = window.dataLayer || [];
  //     window.dataLayer.push({
  //       "gtm.start": new Date().getTime(),
  //       event: "gtm.js",
  //       anonymize_ip: true,
  //     });
  //     setIsGtmInitialized(true);
  //   }
  // }, [isGtmInitialized]);

  // Track page views when pathname or searchParams change
  // useEffect(() => {
  //   if (typeof window !== "undefined" && pathname) {
  //     // Clear previous dataLayer entries to prevent duplicates
  //     const url = window.location.href;
  //     const urlObj = new URL(url);
  //     const pageTitle = document.title;

  //     // Send page view event
  //     sendGTMEvent({
  //       event: "page_view",
  //       page_location: url,
  //       page_path: pathname,
  //       page_title: pageTitle,
  //       page_hostname: urlObj.hostname,
  //     });

  //     console.log(`Page view pushed for: ${pathname}`);
  //   }
  // }, [pathname, searchParams]);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setHasConsent(true);
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setHasConsent(false);
  };

  if (typeof window === "undefined") return null;

  return (
    <>
      {/* Show cookie consent if status is unknown */}
      {hasConsent === null && (
        <CookieConsent onAccept={handleAccept} onDecline={handleDecline} />
      )}

      {/* Always load GTM script */}
      {/* <Script
        id="gtm-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtm.js?id=${gaId}`}
      /> */}
      <GoogleTagManager
        gtmId={gaId}
        dataLayer={{
          anonymize_ip: true,
        }}
      />
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
