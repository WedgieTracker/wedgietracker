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

  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-darkpurple">
        {/*
         * GA4 Consent Mode v2 defaults — must execute before GTM loads.
         * Rendered as a plain React <script> (not next/script) because
         * `strategy="beforeInteractive"` with inline dangerouslySetInnerHTML
         * triggers Safari's HierarchyRequestError under Next 16's streaming
         * metadata + cacheComponents (vercel/next.js#43383).
         * React 19 does not hoist inline scripts, so this executes during
         * HTML parse — before the afterInteractive GTM script.
         */}
        <script dangerouslySetInnerHTML={{ __html: consentDefaultsScript }} />
        <GoogleTagManager gtmId={gtmId} />

        <Suspense>
          <TRPCReactProvider>
            {children}
            <Toaster />

            <Suspense>
              <ConsentBannerGeo />
            </Suspense>
          </TRPCReactProvider>
        </Suspense>
      </body>
    </html>
  );
}
