import "~/styles/globals.css";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/toaster";
import { defaultMetadata } from "~/config/metadata";
import { GoogleTagManager } from "@next/third-parties/google";

import ConsentBanner from "~/components/shared/ConsentBanner";
import {
  CONSENT_REQUIRED_REGIONS,
  isConsentRequiredCountry,
} from "~/lib/consent-region";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = defaultMetadata;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gtmId = process.env.NEXT_PUBLIC_GA_ID!;
  const country = (await headers()).get("x-vercel-ip-country");
  const requiresConsent = isConsentRequiredCountry(country);

  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <meta
          property="og:image"
          content="https://res.cloudinary.com/wedgietracker/image/upload/v1736700345/assets/social-wedgietracker_bibnbu.jpg"
        />
        <meta
          property="twitter:image"
          content="https://res.cloudinary.com/wedgietracker/image/upload/v1736700345/assets/social-wedgietracker_bibnbu.jpg"
        />
        {/* Consent Mode v2 — region-targeted defaults, applied before GTM loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
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
            `,
          }}
        />
      </head>
      <body className="bg-darkpurple">
        <GoogleTagManager gtmId={gtmId} />

        <Suspense>
          <TRPCReactProvider>
            {children}
            <Toaster />

            <ConsentBanner requiresConsent={requiresConsent} />
          </TRPCReactProvider>
        </Suspense>
      </body>
    </html>
  );
}
