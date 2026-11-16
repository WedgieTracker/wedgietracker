"use client";

import type { VideoUrls, Wedgie } from "@wedgietracker/core/types/wedgie";
import {
  pickInitialVideo,
  type ActiveVideo,
} from "@wedgietracker/core/utils/wedgieVideo";
import { wedgiePath } from "@wedgietracker/core/utils/allWedgiesUrl";
import { useState } from "react";
import { ShareButtons } from "~/components/shared/ShareButtons";
import { CourtPositionDiagram } from "~/components/home/CourtPositionDiagram";
import { NoDunksTweetLink } from "~/components/home/NoDunksTweetLink";
import { ReportWedgieButton } from "~/components/home/ReportWedgieButton";
import { WedgieInfoPanel } from "~/components/home/WedgieInfoPanel";
import { WedgieVideoFrame } from "~/components/home/WedgieVideoFrame";
import { WedgieVideoTabs } from "~/components/home/WedgieVideoTabs";

interface WedgieWatchProps {
  wedgie: Wedgie & { types: { name: string }[]; videoUrl: VideoUrls | null };
  /** The previous and next wedgie's links, rendered by the page so crawlers can follow them. */
  nav: React.ReactNode;
}

/** The wedgie modal's card laid out as a page: the clip first, its details beside it. */
export function WedgieWatch({ wedgie, nav }: WedgieWatchProps) {
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(() =>
    pickInitialVideo(wedgie.videoUrl),
  );

  return (
    <div className="w-full">
      <div className="min-h-10">
        {wedgie.videoUrl && (
          <WedgieVideoTabs
            videoUrl={wedgie.videoUrl}
            activeVideo={activeVideo}
            onChange={setActiveVideo}
          />
        )}
      </div>

      <div className="border-darkpurple-lighter bg-darkpurple-darker flex flex-col overflow-hidden rounded-xl lg:flex-row">
        <WedgieVideoFrame
          videoUrl={wedgie.videoUrl}
          activeVideo={activeVideo}
          className="w-full lg:w-[65%]"
        />
        <div className="relative w-full lg:w-[35%]">
          <div className="lg:absolute lg:inset-0 lg:overflow-y-auto">
            <WedgieInfoPanel wedgie={wedgie} />
          </div>
          <div className="pointer-events-none absolute bottom-6 left-8 hidden w-[70px] lg:block">
            <CourtPositionDiagram position={wedgie.position} />
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-row items-center justify-between pb-0.5">
        <div className="flex flex-row gap-1 sm:gap-2">
          {wedgie.noDunksTweet && (
            <NoDunksTweetLink tweetId={wedgie.noDunksTweet.id} />
          )}
          <ShareButtons
            url={wedgiePath(wedgie.seasonName, wedgie.number)}
            title={`Check out this wedgie by ${wedgie.playerName} - ${wedgie.teamName} vs ${wedgie.teamAgainstName} on WedgieTracker!`}
          />
          <ReportWedgieButton wedgie={wedgie} />
        </div>
        {nav}
      </div>
    </div>
  );
}
