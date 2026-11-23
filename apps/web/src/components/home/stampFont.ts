import { Shrikhand } from "next/font/google";

// next/font needs the loader's result assigned to a const in module scope.
const shrikhand = Shrikhand({ weight: "400", subsets: ["latin"] });

/**
 * The face the calendar stamps "NEW WEDGIE!" in, the same one the big numbers
 * use, as a CSS family the stats video's canvas can draw with too.
 */
export const STAMP_FONT = shrikhand.style.fontFamily;
