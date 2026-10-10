"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: { widgets?: { load: (el?: HTMLElement) => void } };
  }
}

const SCRIPT_SRC = "https://platform.twitter.com/widgets.js";

/** An embedded post, with its video or photos, in X's dark theme. */
export function TweetEmbed({ id, label }: { id: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.twttr?.widgets) {
      window.twttr.widgets.load(ref.current ?? undefined);
      return;
    }
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div ref={ref} className="mt-3 max-w-[550px]">
      <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
        <a href={`https://twitter.com/x/status/${id}`}>{label}</a>
      </blockquote>
    </div>
  );
}
