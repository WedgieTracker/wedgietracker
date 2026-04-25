import "~/styles/globals.css";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/toaster";
import { defaultMetadata } from "~/config/metadata";

import ConsentBannerGeo from "~/components/shared/ConsentBannerGeo";
import { CONSENT_REQUIRED_REGIONS } from "~/lib/consent-region";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = defaultMetadata;

/**
 * GA4 Consent Mode v2 defaults + GTM bootstrap, inlined as one plain
 * <script>. Replaces @next/third-parties' <GoogleTagManager>, which is a
 * "use client" wrapper around <Script> and adds an extra client-component
 * boundary at the top of <body>. Folding the dataLayer init + script
 * loader into a single plain SSR script avoids that boundary entirely.
 */
const buildBootstrapScript = (gtmId: string) => `
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

  // GTM bootstrap (inlined from @next/third-parties' _next-gtm-init):
  window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
  (function() {
    var f = document.getElementsByTagName('script')[0];
    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=${gtmId}';
    f.parentNode.insertBefore(j, f);
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gtmId = process.env.NEXT_PUBLIC_GA_ID!;

  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-darkpurple">
        <script
          dangerouslySetInnerHTML={{ __html: buildBootstrapScript(gtmId) }}
        />

        <Suspense fallback={<div className="bg-darkpurple min-h-screen" />}>
          <TRPCReactProvider>
            {children}
            <Toaster />

            <Suspense fallback={null}>
              <ConsentBannerGeo />
            </Suspense>
          </TRPCReactProvider>
        </Suspense>
      </body>
    </html>
  );
}
