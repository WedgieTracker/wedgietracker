import "~/styles/globals.css";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/toaster";
import { defaultMetadata } from "~/config/metadata";

import GoogleAnalytics from "~/components/shared/GoogleAnalytics";

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
      </head>
      <body className="bg-darkpurple">
        {/* GTM noscript iframe for users with JavaScript disabled */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="gtm"
          />
        </noscript>

        <Suspense>
          <TRPCReactProvider>
            {children}
            <Toaster />

            <GoogleAnalytics gaId={gtmId} />
          </TRPCReactProvider>
        </Suspense>
      </body>
    </html>
  );
}
