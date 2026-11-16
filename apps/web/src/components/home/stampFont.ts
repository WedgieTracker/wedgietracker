import { Permanent_Marker } from "next/font/google";

/**
 * The marker face the calendar stamps "NEW WEDGIE!" in, as a CSS family the
 * stats video's canvas can draw with too.
 */
export const STAMP_FONT = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
}).style.fontFamily;
