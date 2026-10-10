"use client";

import { useState } from "react";
import { parseTwitterHandles } from "@wedgietracker/core/utils/twitterHandle";

interface ShoutoutsInputProps {
  id?: string;
  value: string[];
  onChange: (handles: string[]) => void;
}

/**
 * Free-text list of handles. Accepts "@a, b" or pasted profile/tweet URLs. The raw text stays as
 * typed until blur, when it is rewritten to the parsed handles.
 */
export function ShoutoutsInput({ id, value, onChange }: ShoutoutsInputProps) {
  const [text, setText] = useState(() => value.map((h) => `@${h}`).join(", "));
  const parsed = parseTwitterHandles(text);

  return (
    <div className="mt-1 space-y-1">
      <input
        id={id}
        type="text"
        value={text}
        placeholder="@nodunks, https://x.com/someone"
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseTwitterHandles(e.target.value));
        }}
        onBlur={() => setText(parsed.map((h) => `@${h}`).join(", "))}
        className="block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
      />
      {parsed.length > 0 && (
        <p className="text-xs text-white/60">
          Will show: {parsed.map((h) => `@${h}`).join(", ")}
        </p>
      )}
    </div>
  );
}
