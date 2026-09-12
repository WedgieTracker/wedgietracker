import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { confettiColors } from "@/lib/theme";

/**
 * Stand-in for react-confetti, which the web hero fires when the wave tops out.
 * Same palette and circular pieces; the count is lower because each piece is a
 * real view here rather than a canvas draw.
 */
const PIECE_COUNT = 70;
const RADIUS = 4;

interface Piece {
  key: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  size: number;
}

export function Confetti({ width, height }: { width: number; height: number }) {
  const pieces = useMemo<Piece[]>(() => {
    // Deterministic enough; regenerated only when the box resizes.
    return Array.from({ length: PIECE_COUNT }, (_, i) => ({
      key: i,
      x: Math.random() * width,
      color: confettiColors[i % confettiColors.length] ?? "#eaff00",
      delay: Math.random() * 4000,
      // The web uses gravity 0.05, i.e. a slow drift downward.
      duration: 6000 + Math.random() * 5000,
      drift: (Math.random() - 0.5) * 80,
      size: RADIUS * 2 * (0.7 + Math.random() * 0.6),
    }));
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

  // Start immediately; the shared value drives both fall and drift.
  // Must start from an effect: Reanimated forbids writing a shared value
  // during render.
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

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -RADIUS * 4 + progress.value * (height + RADIUS * 8) },
      { translateX: Math.sin(progress.value * Math.PI * 2) * piece.drift },
    ],
    opacity: progress.value > 0.92 ? (1 - progress.value) / 0.08 : 1,
  }));

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
