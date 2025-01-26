"use client";

import { useEffect } from "react";

interface TwitterEmbedProps {
  tweetId: string;
}

export function TwitterEmbed({ tweetId }: TwitterEmbedProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  console.log(tweetId);

  return (
    <div className="w-full">
      <blockquote className="twitter-tweet">
        <a href={`https://twitter.com/x/status/${tweetId}`}></a>
      </blockquote>
    </div>
  );
}
