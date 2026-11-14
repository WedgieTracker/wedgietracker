import { useId } from "react";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

/**
 * Port of apps/web/src/components/support/CoffeeCup.tsx: the takeaway cup,
 * cream with a lid and the badge gradient on its sleeve. `full` shows coffee
 * inside; `steam` curls up above it.
 */
export function CoffeeCup({
  width,
  full = false,
  steam = true,
}: {
  width: number;
  full?: boolean;
  steam?: boolean;
}) {
  const id = `cup${useId().replace(/:/g, "")}`;
  return (
    <Svg width={width} height={(width * 160) / 120} viewBox="0 0 120 160">
      <Defs>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#4769c5" />
          <Stop offset="0.5" stopColor="#36378d" />
          <Stop offset="1" stopColor="#502394" />
        </LinearGradient>
      </Defs>
      {steam ? (
        <G
          fill="none"
          stroke="rgba(240, 225, 182, 0.7)"
          strokeWidth={5}
          strokeLinecap="round"
        >
          <Path d="M48 18c-6-8 6-10 0-18" />
          <Path d="M60 14c-6-8 6-10 0-18" />
          <Path d="M72 18c-6-8 6-10 0-18" />
        </G>
      ) : null}
      <Path
        d="M28 40 L92 40 L84 148 Q60 154 36 148 Z"
        fill={full ? "#6b3a1f" : "#f0e1b6"}
      />
      <Path d="M30 70 L90 70 L87 112 L33 112 Z" fill={`url(#${id}g)`} />
      <SvgText
        x="60"
        y="99"
        textAnchor="middle"
        fontStyle="italic"
        fontWeight="900"
        fontSize="26"
        fill="#f0e1b6"
      >
        W
      </SvgText>
      <Path
        d="M28 40 L92 40 L84 148 Q60 154 36 148 Z"
        fill="none"
        stroke="#2a1660"
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <Rect
        x="22"
        y="28"
        width="76"
        height="14"
        rx="5"
        fill="#f0e1b6"
        stroke="#2a1660"
        strokeWidth={5}
      />
      <Rect
        x="36"
        y="21"
        width="48"
        height="9"
        rx="3"
        fill="#f0e1b6"
        stroke="#2a1660"
        strokeWidth={4}
      />
    </Svg>
  );
}
