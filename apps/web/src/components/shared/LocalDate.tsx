"use client";

import { useEffect, useState } from "react";
import { isGemsDate } from "@wedgietracker/core/utils/formatDate";
import { GemTag } from "./GemTag";

/**
 * Day and month in the visitor's own order and separator (09/11 in the UK,
 * 11/09 in the US, 09.11. in Germany). The server can't know the visitor's
 * locale, so the date is filled in once mounted; until then a no-break space
 * holds the line so the layout doesn't shift.
 */
export function LocalDate({
  date,
  className,
}: {
  date: Date | string;
  className?: string;
}) {
  const [text, setText] = useState<string | null>(null);
  // GEMS have no real date, so they show a GEM tag instead. That doesn't
  // depend on the locale, so it renders straight away.
  const gem = isGemsDate(new Date(date));

  useEffect(() => {
    setText(
      new Date(date).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
      }),
    );
  }, [date]);

  if (gem) {
    return (
      <span className={className}>
        <GemTag />
      </span>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {/* A no-break space keeps the line's height, so nothing shifts when the date arrives. */}
      {text ?? "\u00a0"}
    </span>
  );
}
