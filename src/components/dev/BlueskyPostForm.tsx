"use client";

import { SocialPostForm } from "./SocialPostForm";
import type { WedgieWithTypes } from "~/types/wedgie";

export function BlueskyPostForm({ wedgie }: { wedgie: WedgieWithTypes }) {
  return (
    <SocialPostForm
      wedgie={wedgie}
      platformName="Bluesky"
      endpoint="/api/bluesky/post"
      previewSuffix="\n\n#WeAreWedgie\n\nWedgieTracker.com"
    />
  );
}
