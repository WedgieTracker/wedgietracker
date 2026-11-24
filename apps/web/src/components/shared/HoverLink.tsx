"use client";

import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

/**
 * A Next.js Link that prefetches its page only once someone shows interest:
 * hovering, focusing or touching it. The default Link prefetches every link
 * as soon as it's on screen, so each visit fetched every page in the header,
 * footer and menus, and every one of those counts as a Vercel request. A
 * hover still leaves time to load the page before the click lands.
 */
export default function HoverLink({
  onMouseEnter,
  onFocus,
  onTouchStart,
  prefetch,
  ...props
}: ComponentProps<typeof NextLink>) {
  const [active, setActive] = useState(false);
  return (
    <NextLink
      {...props}
      prefetch={active ? prefetch : false}
      onMouseEnter={(e) => {
        setActive(true);
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        setActive(true);
        onFocus?.(e);
      }}
      onTouchStart={(e) => {
        setActive(true);
        onTouchStart?.(e);
      }}
    />
  );
}
