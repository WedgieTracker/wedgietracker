import "~/styles/globals.css";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/toaster";
import { defaultMetadata } from "~/config/metadata";

import GoogleAnalytics from "~/components/GoogleAnalytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-darkpurple">
        <TRPCReactProvider>
          {children}
          <Toaster />

          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
