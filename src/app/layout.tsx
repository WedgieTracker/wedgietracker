import "~/styles/globals.css";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/toaster";
import { defaultMetadata } from "~/config/metadata";
import { GoogleTagManager } from "@next/third-parties/google";

import ConsentBannerGeo from "~/components/shared/ConsentBannerGeo";
import { CONSENT_REQUIRED_REGIONS } from "~/lib/consent-region";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = defaultMetadata;

/**
 * GA4 Consent Mode v2 defaults — must execute before GTM loads. Rendered
 * inline so the browser runs it during HTML parse, before <GoogleTagManager>
 * (afterInteractive) injects gtm.js.
 */
const consentDefaultsScript = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  var stored = null;
  try { stored = localStorage.getItem('cookieConsent'); } catch(e) {}

  if (stored === 'accepted') {
    gtag('consent', 'default', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  } else if (stored === 'declined') {
    gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  } else {
    gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      region: ${JSON.stringify(CONSENT_REQUIRED_REGIONS)}
    });
    gtag('consent', 'default', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }

  gtag('set', 'url_passthrough', true);
  gtag('set', 'ads_data_redaction', true);
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gtmId = process.env.NEXT_PUBLIC_GA_ID!;
  // Only fire analytics on the production Vercel deployment. VERCEL_ENV is a
  // server-only deploy constant ("production" | "preview" | "development") that
  // is undefined locally, so localhost admin work (which talks to the remote
  // prod DB) and preview deploys stop polluting the production GA4 property.
  // Do NOT gate on NODE_ENV — it is pinned to "production" in .env.local.
  const analyticsEnabled = process.env.VERCEL_ENV === "production";

  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-darkpurple">
        {analyticsEnabled && (
          <>
            {/*
              DO NOT convert this to next/script `beforeInteractive`. That path
              routes the inline script through the runtime __next_s injection
              queue / <head>, which crashes Safari with HierarchyRequestError
              (blank page) under Next 16 streaming metadata + cacheComponents
              (vercel/next.js#43383). React 19 does not hoist inline (non-src)
              scripts, so this plain <script> is emitted inline in <body> and
              runs during HTML parse — before GTM's afterInteractive gtm.js —
              preserving consent-before-GTM ordering. See #86/#89; #108 reverted
              this and is what this restores.
            */}
            <script
              dangerouslySetInnerHTML={{ __html: consentDefaultsScript }}
            />
            <GoogleTagManager gtmId={gtmId} />
          </>
        )}

        <TRPCReactProvider>
          {children}
          <Toaster />

          <Suspense fallback={null}>
            <ConsentBannerGeo />
          </Suspense>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
