import { Permanent_Marker } from "next/font/google";

// next/font needs the loader's result assigned to a const in module scope.
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"] });

/**
 * The marker face the calendar stamps "NEW WEDGIE!" in, as a CSS family the
 * stats video's canvas can draw with too.
 */
export const STAMP_FONT = marker.style.fontFamily;
