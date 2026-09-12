import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Stand-in for react-confetti, which the web hero fires when the wave tops out.
 *
 * The web draws flat circles on a canvas with `gravity: 0.05`. Reproducing that
 * literally on native looked like static speckle, so each piece here also
 * accelerates as it falls, sways, and tumbles end-over-end.
 */
const PIECE_COUNT = 90;

/**
 * The web palette (Wave.tsx). The two dark values are unreadable as foreground
 * pieces against a full pink wave, so they are used only for the small, slow,
 * translucent pieces where they read as depth rather than dirt.
 */
const NEAR_COLORS = ["#eaff00", "#ff03ff", "#efff40", "#ffffff"] as const;
const FAR_COLORS = ["#542299", "#180138"] as const;

interface Piece {
  key: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  sway: number;
  swayFreq: number;
  phase: number;
  spin: number;
  opacity: number;
}

export function Confetti({ width, height }: { width: number; height: number }) {
  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: PIECE_COUNT }, (_, i) => {
      // 0 = far (small, slow, dim), 1 = near (large, fast, bright)
      const depth = Math.random();
      const near = depth > 0.3;
      const palette = near ? NEAR_COLORS : FAR_COLORS;

      return {
        key: i,
        x: Math.random() * width,
        color: palette[i % palette.length] ?? "#eaff00",
        // Spread starts across a full cycle so nothing resets in unison.
        delay: Math.random() * 7000,
        duration: 9000 - depth * 4500,
        size: 4 + depth * 6,
        sway: 10 + depth * 45,
        swayFreq: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        spin: 1 + Math.random() * 3,
        opacity: near ? 0.75 + depth * 0.25 : 0.35 + depth * 0.5,
      };
    });
  }, [width]);

  if (width <= 0 || height <= 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <Flake key={piece.key} piece={piece} height={height} />
      ))}
    </View>
  );
}

function Flake({ piece, height }: { piece: Piece; height: number }) {
  const progress = useSharedValue(0);

  // Reanimated forbids writing a shared value during render.
  useEffect(() => {
    progress.value = withDelay(
      piece.delay,
      withRepeat(
        withTiming(1, { duration: piece.duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [piece.delay, piece.duration, progress]);

  const travel = height + piece.size * 4;

  const style = useAnimatedStyle(() => {
    const t = progress.value;

    // Mostly quadratic, so pieces visibly pick up speed on the way down.
    const fall = t * t * 0.82 + t * 0.18;
    const sway =
      Math.sin(t * piece.swayFreq * Math.PI * 2 + piece.phase) * piece.sway;

    // Squashing the disc edge-on reads as tumbling without needing a sprite.
    const tumble = Math.abs(Math.cos(t * piece.spin * Math.PI * 2));

    return {
      transform: [
        { translateY: -piece.size * 2 + fall * travel },
        { translateX: sway },
        { scaleY: 0.2 + tumble * 0.8 },
      ],
      // Fade at both ends so the loop point is never visible.
      opacity: interpolate(t, [0, 0.06, 0.88, 1], [0, 1, 1, 0]) * piece.opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size,
          borderRadius: piece.size / 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: "absolute", top: 0 },
});
