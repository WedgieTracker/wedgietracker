import { tweetUrl } from "@wedgietracker/core/utils/twitterHandle";
// Imported rather than served from public/ so the build gives it a hashed,
// long-cached URL.
import noDunksLogo from "~/assets/nodunks-logo.png";

/** No Dunks logo, as a squircle like the share buttons, linking to the tweet that announced the wedgie. */
export function NoDunksTweetLink({ tweetId }: { tweetId: string }) {
  return (
    <a
      href={tweetUrl("NoDunksInc", tweetId)}
      target="_blank"
      rel="noopener noreferrer"
      title="No Dunks tweet"
      aria-label="No Dunks tweet"
      className="hover:ring-yellow flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md transition-all duration-300 hover:ring-2 sm:size-8"
    >
      <img
        src={noDunksLogo.src}
        alt=""
        width={32}
        height={32}
        className="size-full"
      />
    </a>
  );
}
