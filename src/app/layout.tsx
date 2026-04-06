import "~/styles/globals.css";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/toaster";
import { defaultMetadata } from "~/config/metadata";
import { GoogleTagManager } from "@next/third-parties/google";

import ConsentBanner from "~/components/shared/ConsentBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gtmId = process.env.NEXT_PUBLIC_GA_ID!;

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
        {/* Set consent mode defaults before GTM loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              var hasConsent = false;
              try { hasConsent = localStorage.getItem('cookieConsent') === 'accepted'; } catch(e) {}

              gtag('consent', 'default', {
                'analytics_storage': hasConsent ? 'granted' : 'denied',
                'ad_storage': hasConsent ? 'granted' : 'denied',
                'ad_user_data': hasConsent ? 'granted' : 'denied',
                'ad_personalization': hasConsent ? 'granted' : 'denied',
              });
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

            <ConsentBanner />
          </TRPCReactProvider>
        </Suspense>
      </body>
    </html>
  );
}
