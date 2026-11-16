"use client";

import { useState } from "react";
import { parseShoutouts } from "@wedgietracker/core/utils/shoutout";

interface ShoutoutsInputProps {
  id?: string;
  value: string[];
  onChange: (handles: string[]) => void;
}

/**
 * Free-text list of X and Bluesky handles. Accepts "@a, b.bsky.social" or pasted x.com and
 * bsky.app profile URLs. The raw text stays as
 * typed until blur, when it is rewritten to the parsed handles.
 */
export function ShoutoutsInput({ id, value, onChange }: ShoutoutsInputProps) {
  const [text, setText] = useState(() => value.map((h) => `@${h}`).join(", "));
  const parsed = parseShoutouts(text);

  return (
    <div className="mt-1 space-y-1">
      <input
        id={id}
        type="text"
        value={text}
        placeholder="@nodunks, name.bsky.social, https://x.com/someone"
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseShoutouts(e.target.value));
        }}
        onBlur={() => setText(parsed.map((h) => `@${h}`).join(", "))}
        className="border-violet/30 bg-panel text-cream block w-full rounded-md p-2"
      />
      {parsed.length > 0 && (
        <p className="text-cream/60 text-xs">
          Will show: {parsed.map((h) => `@${h}`).join(", ")}
        </p>
      )}
    </div>
  );
}
