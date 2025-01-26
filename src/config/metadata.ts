import type { Metadata } from "next";

const APP_NAME = "WedgieTracker";
const APP_DESCRIPTION =
  "NBA original WedgieTracker. We count how many times a basketball gets stuck between the rim and the backboard. NoDunks Inspired.";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.wedgietracker.com";

export const defaultMetadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: "https://res.cloudinary.com/wedgietracker/image/upload/v1736700345/assets/social-wedgietracker_bibnbu.jpg",
        width: 1200,
        height: 630,
        alt: "WedgieTracker Social Share Image",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_NAME,
      template: `%s | ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: "https://res.cloudinary.com/wedgietracker/image/upload/v1736700345/assets/social-wedgietracker_bibnbu.jpg",
        width: 1200,
        height: 630,
        alt: "WedgieTracker Social Share Image",
      },
    ],
  },
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
};

export function generateMetadata({
  title,
  description,
  image,
  noIndex,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    ...defaultMetadata,
    title: title,
    description: description,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: title,
      description: description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: title,
      description: description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
}
