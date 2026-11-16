import { TwitterPostForm } from "./TwitterPostForm";
import { InstagramUploadForm } from "./InstagramUploadForm";
import { YouTubeUploadForm } from "./YouTubeUploadForm";
import { BlueskyPostForm } from "./BlueskyPostForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import type { WedgieWithTypes } from "@wedgietracker/core/types/wedgie";

interface WedgieSocialShareProps {
  wedgie: WedgieWithTypes;
}

export function WedgieSocialShare({ wedgie }: WedgieSocialShareProps) {
  return (
    <div className="mt-8">
      <h2 className="text-cream mb-6 text-2xl font-bold">Share Wedgie</h2>
      <Tabs defaultValue="youtube" className="mb-6">
        <TabsList className="bg-panel mb-2 grid w-full grid-cols-4">
          <TabsTrigger
            value="youtube"
            className="data-[state=active]:bg-cream text-cream"
          >
            YouTube
          </TabsTrigger>
          <TabsTrigger
            value="instagram"
            className="data-[state=active]:bg-cream text-cream"
          >
            Instagram
          </TabsTrigger>
          <TabsTrigger
            value="twitter"
            className="data-[state=active]:bg-cream text-cream"
          >
            Twitter
          </TabsTrigger>
          <TabsTrigger
            value="bluesky"
            className="data-[state=active]:bg-cream text-cream"
          >
            Bluesky
          </TabsTrigger>
        </TabsList>
        <TabsContent value="youtube">
          <YouTubeUploadForm wedgie={wedgie} />
        </TabsContent>
        <TabsContent value="instagram">
          <InstagramUploadForm wedgie={wedgie} />
        </TabsContent>
        <TabsContent value="twitter">
          <TwitterPostForm wedgie={wedgie} />
        </TabsContent>
        <TabsContent value="bluesky">
          <BlueskyPostForm wedgie={wedgie} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
