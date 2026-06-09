"use client";

import { TwitterAuth } from "./TwitterAuth";
import { toast } from "~/hooks/use-toast";
import { SocialPostForm } from "./SocialPostForm";
import type { WedgieWithTypes } from "~/types/wedgie";

export function TwitterPostForm({ wedgie }: { wedgie: WedgieWithTypes }) {
  return (
    <SocialPostForm
      wedgie={wedgie}
      platformName="Twitter"
      endpoint="/api/twitter/upload"
      previewSuffix={"\n\nWedgieTracker.com"}
      headerExtra={<TwitterAuth />}
      preflight={() => {
        const hasCredentials =
          process.env.NEXT_PUBLIC_HAS_TWITTER_CREDENTIALS === "true";
        if (!hasCredentials) {
          toast({
            title: "Error",
            description:
              "Twitter credentials not configured. Please check server configuration.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      }}
    />
  );
}
