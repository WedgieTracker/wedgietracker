import { TwitterPostForm } from "./TwitterPostForm";
import { InstagramUploadForm } from "./InstagramUploadForm";
import { YouTubeUploadForm } from "./YouTubeUploadForm";
import { BlueskyPostForm } from "./BlueskyPostForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import type { WedgieWithTypes } from "~/types/wedgie";

interface WedgieSocialShareProps {
  wedgie: WedgieWithTypes;
}

export function WedgieSocialShare({ wedgie }: WedgieSocialShareProps) {
  return (
    <div className="mt-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Share Wedgie</h2>
      <Tabs defaultValue="youtube" className="mb-6">
        <TabsList className="mb-2 grid w-full grid-cols-4 bg-white/10">
          <TabsTrigger
            value="youtube"
            className="data-[state=active]:bg-yellow text-white"
          >
            YouTube
          </TabsTrigger>
          <TabsTrigger
            value="instagram"
            className="data-[state=active]:bg-yellow text-white"
          >
            Instagram
          </TabsTrigger>
          <TabsTrigger
            value="twitter"
            className="data-[state=active]:bg-yellow text-white"
          >
            Twitter
          </TabsTrigger>
          <TabsTrigger
            value="bluesky"
            className="data-[state=active]:bg-yellow text-white"
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
