"use client";

import { useEffect, useState } from "react";
import { GEMS_EMOJI, isGemsDate } from "@wedgietracker/core/utils/formatDate";

/**
 * Day and month in the visitor's own order and separator (09/11 in the UK,
 * 11/09 in the US, 09.11. in Germany). The server can't know the visitor's
 * locale, so the date is filled in once mounted; until then a fixed-width
 * blank keeps the layout from shifting.
 */
export function LocalDate({
  date,
  className,
}: {
  date: Date | string;
  className?: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date(date);
    setText(
      isGemsDate(d)
        ? GEMS_EMOJI
        : d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" }),
    );
  }, [date]);

  return (
    <span className={className} suppressHydrationWarning>
      {text ?? " "}
    </span>
  );
}
