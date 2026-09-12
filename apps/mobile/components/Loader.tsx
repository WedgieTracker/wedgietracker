import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "@/lib/theme";

/**
 * Port of the site's loading animation: apps/web/src/components/shared/Loader.tsx
 * for the artwork, and the `.og-animation` rules plus the `wedgieAnimation`
 * keyframes in apps/web/src/styles/globals.css for the layout and the motion.
 *
 * A square patch of court. A backboard hangs in the top left, the rim crosses
 * below it, and the ball flies in from the right, wedges itself between the two
 * for most of the cycle, then drops out through the bottom and comes round
 * again - the wedgie the site is named after.
 *
 * The paths are inlined rather than fetched so the loader stays vector at any
 * size and needs no network, which matters most on the screens where it is the
 * first thing drawn.
 */

// Layer boxes, as fractions of the square container, from
// `.og-animation .backboard | .ball | .rim`. Paint order is backboard, ball,
// rim: the rim is later in the web DOM at the same z-index, so it covers the
// ball and the ball looks genuinely stuck behind it.
const BACKBOARD_BOX = { left: 0, top: 0, width: 0.66, height: 0.51 };
const BALL_BOX = { left: 0.38, top: 0.29, size: 0.28 };
const RIM_BOX = { left: 0.14, top: 0.4, width: 0.38, height: 0.31 };

/**
 * The hoop occupies the left two thirds of the artwork, so centring the square
 * leaves the hoop sitting left of centre with the ball's approach cramped
 * against the right edge.
 *
 * `RUN_UP` widens the box to the right to give the ball somewhere to fly in
 * from, and `HOOP_CENTRE` is where the hoop actually balances within the
 * artwork - the two together let the layout centre the hoop rather than the
 * box.
 */
const RUN_UP = 0.24;
const HOOP_CENTRE = (BACKBOARD_BOX.left + BACKBOARD_BOX.width) / 2;

/**
 * The web SVGs carry the colours the artwork was exported with. Two of them are
 * the brand tokens give or take a digit - #dfff00 against yellow, #17002d
 * against darkpurple - so those come from the theme; the other three have no
 * token to come from.
 */
const BACKBOARD_FRAME = "#58009f";
const BALL_SEAMS = "#ff5100";
const RIM_BAR = "#e1251b";

const BACKBOARD_VIEWBOX = "0 0 1338.03 1026.62";
const BACKBOARD_PATHS = [
  "M1205.2,41c50.64,0,91.83,41.19,91.83,91.83v760.96c0,50.64-41.19,91.83-91.83,91.83H132.83c-50.64,0-91.83-41.19-91.83-91.83V132.83c0-50.64,41.19-91.83,91.83-91.83h1072.37M1205.2,0H132.83C59.47,0,0,59.47,0,132.83v760.96c0,73.36,59.47,132.83,132.83,132.83h1072.37c73.36,0,132.83-59.47,132.83-132.83V132.83c0-73.36-59.47-132.83-132.83-132.83h0Z",
  "M917.7,323.24h-499.69c-50.18,0-90.86,40.68-90.86,90.86v367.88h33v-367.88c0-31.91,25.96-57.86,57.86-57.86h499.69c31.91,0,57.86,25.96,57.86,57.86v367.88h33v-367.88c0-50.18-40.68-90.86-90.86-90.86Z",
] as const;

const BALL_VIEWBOX = "0 0 564.2 564.2";
const BALL_PATHS = [
  "M96.49,232.36c.91-2.22,1.62-4.33,2.6-6.3,4.43-8.92,8.92-17.82,13.44-26.69,1.97-3.87,4.18-7.61,6.1-11.51.81-1.63,1.67-1.94,3.24-1.2,21.95,10.37,45.23,10.6,68.72,8.8,22.54-1.73,44.72-5.86,66.84-10.34,33.34-6.75,66.61-13.83,100.02-20.23,26.74-5.12,53.73-8.45,81-9.08,19.07-.44,38.05.42,56.72,4.45,8.77,1.89,17.32,4.83,25.96,7.32,2.64.76,4.2,2.6,5.28,5.1,9.51,21.9,16.24,44.61,20.07,68.19,4.03,24.79,3.99,49.63,1.22,74.53-.3,2.69-1.31,4.75-3.22,6.62-6.91,6.75-15.3,10.94-24.21,14.23-19.58,7.23-40,10.07-60.68,11.3-27.98,1.67-55.84-.1-83.55-3.88-18.71-2.55-37.31-5.88-55.59-10.71-13.09-3.46-26.29-6.64-39.18-10.74-22.96-7.31-45.66-15.42-67.49-25.76-9.88-4.68-19.92-9.02-29.76-13.77-8.3-4.01-16.46-8.32-24.62-12.61-7.4-3.89-14.87-7.67-22.04-11.95-11.24-6.71-22.26-13.77-33.35-20.73-2.48-1.56-4.87-3.27-7.52-5.06Z",
  "M541.67,346.59c-4.67,19.78-11.51,38.05-20.4,55.5-18.92,37.13-44.77,68.56-78.2,93.6-2.88,2.16-5.88,4.16-8.72,6.36-7.98,6.15-17.11,9.6-26.84,11.85-18.69,4.32-37.52,6.09-56.64,3.64-9.45-1.21-18.7-3.25-27.86-5.91-9.93-2.89-19.57-6.53-28.73-11.23-9.39-4.83-18.67-9.98-27.54-15.71-28.05-18.11-52.61-40.46-76.15-63.96-20.66-20.63-39.82-42.64-58.93-64.69-12.73-14.69-25.2-29.62-39.5-42.84-4.56-4.22-9.32-8.23-14.12-12.17-1.66-1.36-2.42-2.53-1.81-4.78,2.34-8.57,4.35-17.24,6.75-25.8,1.91-6.82,4.21-13.52,6.47-20.69,1.99,1.14,3.7,2.07,5.37,3.08,12.91,7.89,25.66,16.07,38.78,23.61,10.47,6.02,21.43,11.19,32.1,16.89,14.91,7.96,30.19,15.14,45.8,21.56,16,6.58,32.12,12.93,48.36,18.88,11.15,4.08,22.53,7.56,33.94,10.84,10.27,2.96,20.69,5.47,31.11,7.85,18.34,4.18,36.86,7.47,55.54,9.73,34.08,4.12,68.22,5.52,102.39,1.14,16.98-2.18,33.69-5.63,49.49-12.54,2.98-1.3,5.93-2.67,9.34-4.21Z",
  "M511.91,145.78c-14.91-3.96-29.51-6.09-44.26-7.19-15.18-1.13-30.36-.84-45.53.1-27.52,1.69-54.73,5.76-81.73,11.13-29.81,5.93-59.52,12.35-89.32,18.35-21.07,4.24-42.23,8.02-63.72,9.59-12.97.95-25.92,1.07-38.78-1.23-3.43-.61-6.82-1.53-10.14-2.59-2.81-.89-5.49-2.19-8.57-3.44,2.91-4.07,5.66-8.02,8.53-11.88,19.5-26.29,42.27-49.4,68.27-69.26,15.43-11.79,31.81-22.11,49-31.22,21.2-11.25,43.32-20.09,66.33-26.75,8.24-2.39,16.66-4.16,24.93-6.47,6.48-1.81,12.5-.02,18.27,2.29,13.6,5.45,27.33,10.69,40.43,17.2,20.44,10.16,38.89,23.44,55.83,38.79,16.06,14.56,30.12,30.84,42.26,48.79,2.55,3.77,4.84,7.72,7.22,11.6.32.51.51,1.1,1,2.2Z",
  "M362.79,536.66c-1.5.61-2.96,1.36-4.51,1.81-27.1,7.93-54.73,11.91-82.99,11.24-16.16-.39-32.13-2.28-47.98-5.51-20.59-4.19-40.13-11.35-59.21-19.95-28.44-12.82-53.31-30.77-75.38-52.66-13.32-13.2-11.49-10.58-15.73-29.66-5.05-22.71-7.66-45.7-8.09-68.94-.32-17.13.86-34.18,2.88-51.18.07-.6.34-1.17.69-2.29,4.58,4.31,8.93,8.24,13.11,12.35,15.41,15.15,29.17,31.79,43.31,48.09,24.04,27.7,48.87,54.63,76.14,79.21,16.97,15.29,34.75,29.54,53.97,41.93,16.3,10.5,33.63,18.96,51.92,25.35,13.72,4.79,27.85,8,42.38,9.22,3.1.26,6.22.25,9.34.37.06.21.11.43.17.64Z",
  "M310.01,16.08c-80.52,26.32-145.55,73.52-194.29,143.65-1.3-1.49-2.64-2.76-3.66-4.24-7.49-10.92-9.75-23.08-8.09-36.03,1.52-11.87,4.9-23.2,10.78-33.68,3.26-5.8,6.65-11.53,10.18-17.17,3.78-6.03,9.13-10.44,15.22-14.05,13.34-7.91,27.01-15.19,41.43-20.94,39.09-15.59,79.59-22.13,121.61-18.82,2.18.17,4.35.36,6.53.54.09.24.19.48.28.73Z",
  "M81.48,220.95c-3.14-2.7-6.1-5.18-8.99-7.74-9.68-8.58-18.81-17.69-25.27-29.01-2.56-4.47-4.42-9.39-6.12-14.28-.59-1.68-.25-4.11.56-5.77,3.18-6.57,6.46-13.12,10.15-19.42,7.76-13.22,16.75-25.6,26.74-37.23,3.9-4.53,7.96-8.92,11.95-13.38l.71.32c-.47,1.83-.91,3.67-1.41,5.49-4.43,16.07-5.72,32.2-.98,48.45,2.76,9.45,7.72,17.6,14.57,24.63,2.35,2.41,2.41,2.48.64,5.24-6.88,10.74-12.41,22.19-17.93,33.65-1.38,2.85-2.88,5.65-4.62,9.04Z",
  "M59.44,288.72c-14.53-7.46-28.94-13.62-45.49-5.92.09-31.59,4.96-61.81,16.01-91.26.53.49,1.14.85,1.47,1.39,9.74,16.16,23.03,29.09,37.61,40.73,3.77,3.01,5.96,5.3,3.69,10.53-2.6,5.99-4.17,12.44-5.98,18.76-2.25,7.83-4.27,15.71-6.41,23.57-.19.69-.53,1.33-.89,2.2Z",
  "M54.77,423.63c-.53-.74-1.12-1.43-1.58-2.21-17.97-30.37-30.41-62.78-35.78-97.76-.68-4.46-1.22-9.01-1.1-13.5.1-3.64,2.2-6.8,4.67-9.52,4.1-4.51,9.19-4,14.43-2.75,6.71,1.6,12.57,5.05,18.52,8.32,2.26,1.24,2.13,3.08,1.79,5.19-3.51,21.5-5.18,43.16-4.27,64.93.54,13.08,1.74,26.13,2.75,39.18.2,2.62.89,5.19,1.36,7.79l-.78.33Z",
] as const;

const RIM_VIEWBOX = "0 0 775.38 619.2";
const RIM_PATHS = [
  "M30.17,56.34c-14.43,0-26.17-11.74-26.17-26.17S15.74,4,30.17,4h715.04c14.43,0,26.17,11.74,26.17,26.17s-11.74,26.17-26.17,26.17H30.17Z",
  "M745.21,8c12.24,0,22.17,9.93,22.17,22.17s-9.93,22.17-22.17,22.17H30.17c-12.24,0-22.17-9.93-22.17-22.17S17.93,8,30.17,8h715.04M745.21,0H30.17C13.53,0,0,13.53,0,30.17s13.53,30.17,30.17,30.17h715.04c16.64,0,30.17-13.53,30.17-30.17s-13.53-30.17-30.17-30.17h0Z",
  "M603.79,615.2c-7.88,0-14.29-6.41-14.29-14.29v-47.33l-31.61-31.56-79.11,78.87c-2.7,2.69-6.28,4.17-10.09,4.17s-7.42-1.49-10.12-4.2c-.66-.66-1.25-1.4-1.81-2.26l-74.11-73.97-74.11,73.97c-.56.86-1.15,1.61-1.8,2.26-2.71,2.71-6.3,4.2-10.13,4.2s-7.39-1.48-10.09-4.17l-79.11-78.86-31.61,31.55v47.33c0,7.88-6.41,14.29-14.29,14.29s-14.29-6.41-14.29-14.29v-313.65L59.15,96.25c-1.6-3.47-1.75-7.35-.43-10.93,1.32-3.58,3.96-6.43,7.43-8.03,1.89-.87,3.91-1.32,5.98-1.32,5.56,0,10.66,3.26,12.99,8.31l88.3,191.52,120.18,119.81,69.88-69.75-39.06-33.66-58.55-197.88c-1.08-3.66-.68-7.52,1.15-10.88s4.84-5.8,8.51-6.88c1.32-.39,2.69-.59,4.06-.59,6.28,0,11.91,4.21,13.7,10.24l56.17,189.82,33.22,28.63,33.22-28.63,56.16-189.82c1.78-6.03,7.42-10.24,13.7-10.24,1.37,0,2.74.2,4.07.59,3.66,1.08,6.68,3.53,8.5,6.88,1.82,3.35,2.23,7.22,1.15,10.88l-58.55,197.88-39.06,33.66,69.88,69.75,120.18-119.81,88.3-191.52c2.33-5.05,7.42-8.32,12.98-8.32,2.08,0,4.09.44,5.99,1.32,3.46,1.6,6.1,4.45,7.42,8.03,1.32,3.58,1.17,7.46-.43,10.93l-88.06,191v313.65c0,7.88-6.41,14.29-14.29,14.29ZM296.37,570.35l65.96-65.84-68.73-68.52-65.96,65.84,68.73,68.52ZM468.92,570.35l68.73-68.52-65.96-65.83-68.73,68.52,65.96,65.84ZM589.5,513.19v-22.68l-11.37,11.33,11.37,11.35ZM175.8,513.19l11.37-11.35-11.37-11.33v22.68ZM382.64,484.4l68.81-68.6-68.81-68.69-68.81,68.69,68.81,68.6ZM207.4,481.65l65.96-65.84-97.56-97.26v131.59l31.6,31.5ZM557.89,481.65l31.6-31.5v-131.59l-97.56,97.26,65.96,65.84Z",
  "M693.16,79.97c1.44,0,2.91.31,4.31.95,5.16,2.38,7.42,8.5,5.04,13.66l-88.43,191.8v314.53c0,5.68-4.61,10.29-10.29,10.29s-10.29-4.61-10.29-10.29v-48.99l-35.61-35.55-81.94,81.68c-2.01,2-4.64,3-7.27,3s-5.28-1.01-7.29-3.03c-.6-.6-1.07-1.26-1.49-1.95l-77.26-77.11-77.26,77.11c-.42.69-.9,1.35-1.49,1.95-2.01,2.02-4.65,3.03-7.29,3.03s-5.26-1-7.27-3l-81.93-81.68-35.61,35.55v48.98c0,5.68-4.61,10.29-10.29,10.29s-10.29-4.61-10.29-10.29v-314.53L62.78,94.58c-2.38-5.16-.12-11.28,5.04-13.66,1.4-.64,2.86-.95,4.3-.95,3.89,0,7.62,2.22,9.35,5.99l88.6,192.18,123.51,123.13,75.75-75.61-41.44-35.71-58.22-196.76c-1.61-5.45,1.5-11.18,6.95-12.79.97-.29,1.96-.43,2.93-.43,4.44,0,8.54,2.9,9.86,7.38l56.5,190.95,36.72,31.64,36.72-31.64,56.5-190.95c1.32-4.48,5.42-7.38,9.86-7.38.97,0,1.95.14,2.93.43,5.45,1.61,8.56,7.34,6.95,12.79l-58.22,196.76-41.44,35.71,75.75,75.61,123.51-123.13,88.6-192.17c1.73-3.77,5.46-5.99,9.35-5.99M207.4,487.3l71.62-71.49-107.22-106.89v143.06c.32.25.66.48.95.78l34.65,34.54M557.89,487.3l34.65-34.54c.3-.3.63-.53.96-.78v-143.06l-107.22,106.89,71.62,71.49M382.64,490.05l74.48-74.25-74.48-74.34-74.48,74.34,74.48,74.25M468.91,576l74.4-74.17-71.62-71.49-74.4,74.17,71.62,71.49M296.37,576l71.62-71.49-74.4-74.17-71.62,71.49,74.4,74.17M593.5,522.84v-41.96l-21.03,20.97,21.03,20.99M171.8,522.83l21.03-20.99-21.03-20.97v41.96M693.16,71.97c-7.12,0-13.64,4.18-16.62,10.64l-88,190.87-116.85,116.48-64-63.88,34.91-30.08,1.78-1.54.67-2.26,58.22-196.76c1.39-4.69.87-9.63-1.47-13.92-2.33-4.29-6.2-7.42-10.89-8.81-1.69-.5-3.44-.76-5.2-.76-8.04,0-15.25,5.39-17.53,13.11l-55.83,188.69-29.72,25.61-29.72-25.61-55.83-188.69c-2.29-7.72-9.5-13.11-17.53-13.11-1.76,0-3.51.26-5.21.76-4.67,1.38-8.54,4.51-10.87,8.8-2.33,4.29-2.85,9.24-1.47,13.92l58.22,196.76.67,2.26,1.78,1.54,34.91,30.08-64,63.88-116.84-116.48L88.74,82.61c-2.98-6.46-9.5-10.64-16.62-10.64-2.65,0-5.23.57-7.65,1.68-4.44,2.05-7.81,5.7-9.5,10.28-1.69,4.58-1.5,9.55.55,13.99l87.69,190.21v312.77c0,10.09,8.21,18.29,18.29,18.29s18.29-8.21,18.29-18.29v-45.67l27.61-27.56,76.28,76.05c3.46,3.44,8.04,5.34,12.92,5.34s9.49-1.91,12.95-5.38c.76-.76,1.44-1.6,2.09-2.54l71-70.87,71,70.87c.64.95,1.33,1.79,2.08,2.54,3.46,3.47,8.06,5.38,12.96,5.38s9.46-1.9,12.92-5.34l76.28-76.05,27.61,27.56v45.67c0,10.09,8.21,18.29,18.29,18.29s18.29-8.21,18.29-18.29v-312.77l87.69-190.21c2.05-4.44,2.24-9.4.55-13.99-1.69-4.58-5.07-8.24-9.5-10.28-2.42-1.12-4.99-1.69-7.66-1.69h0ZM179.8,448.48v-120.3l87.89,87.62-60.3,60.18-27.6-27.51h0ZM497.6,415.81l87.89-87.62v120.29l-27.6,27.52-60.29-60.18h0ZM319.5,415.8l63.15-63.03,63.15,63.03-63.15,62.96-63.15-62.95h0ZM408.62,504.52l63.07-62.87,60.29,60.18-63.07,62.87-60.29-60.18h0ZM233.3,501.83l60.3-60.18,63.07,62.87-60.29,60.18-63.07-62.87h0ZM583.79,501.85l1.7-1.7v3.4l-1.7-1.7h0ZM179.8,503.55v-3.4l1.7,1.7-1.7,1.7h0Z",
] as const;
const RIM_FILLS = [RIM_BAR, colors.darkpurple, colors.white, colors.darkpurple];

/** `animation-duration: 1.5s` */
const CYCLE_MS = 1500;

/**
 * `@keyframes wedgieAnimation`. `at` is the CSS keyframe percentage as a
 * fraction of the cycle. `tx`/`ty` are the `translate()` percentages, so they
 * are multiples of the ball's own size, and they sit after `scale` in the
 * transform list in both CSS and React Native - meaning the travel grows with
 * the scale in exactly the same way.
 */
const KEYFRAMES = [
  { at: 0, scale: 1.5, tx: 2, ty: 0.5, opacity: 0 },
  { at: 0.02, scale: 1.5, tx: 2, ty: 0.5, opacity: 1 },
  { at: 0.2, scale: 1, tx: 0, ty: 0, opacity: 1 },
  { at: 0.8, scale: 1, tx: 0, ty: 0, opacity: 1 },
  { at: 0.93, scale: 1, tx: 0, ty: 3, opacity: 1 },
  // 95% declares only `opacity`, so the transform here is wherever the
  // 93% -> 100% ramp has got to by then.
  { at: 0.95, scale: 1.142857, tx: 0.571429, ty: 2.285714, opacity: 0 },
  { at: 1, scale: 1.5, tx: 2, ty: 0.5, opacity: 0 },
] as const;

const STOPS = KEYFRAMES.map((k) => k.at);
const SCALE = KEYFRAMES.map((k) => k.scale);
const TX = KEYFRAMES.map((k) => k.tx);
const TY = KEYFRAMES.map((k) => k.ty);
const OPACITY = KEYFRAMES.map((k) => k.opacity);

/** `animation-timing-function: ease-in-out` is this curve. */
const EASE_IN_OUT = Easing.bezierFn(0.42, 0, 0.58, 1);

/**
 * CSS restarts the timing function on every segment, so the cycle is six eased
 * ramps rather than one. Instead of hunting for the current segment on every
 * frame, bake the easing once into a time remap: linear clock in, eased
 * position along the keyframe track out. Each property is then a plain linear
 * lookup against that position.
 */
const SAMPLES_PER_SEGMENT = 8;

function bakeEasedClock() {
  const input: number[] = [];
  const output: number[] = [];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const from = KEYFRAMES[i]?.at ?? 0;
    const to = KEYFRAMES[i + 1]?.at ?? 1;
    // Only the final segment contributes its end point, so the samples stay
    // strictly increasing where two segments meet.
    const last = i === KEYFRAMES.length - 2;
    const count = last ? SAMPLES_PER_SEGMENT + 1 : SAMPLES_PER_SEGMENT;

    for (let s = 0; s < count; s++) {
      const t = s / SAMPLES_PER_SEGMENT;
      input.push(from + (to - from) * t);
      output.push(from + (to - from) * EASE_IN_OUT(t));
    }
  }

  return { input, output };
}

const CLOCK = bakeEasedClock();

/** Halfway through the cycle is the middle of the 20%-80% hold. */
const WEDGED = 0.5;

export function Loader({ size = 96 }: { size?: number }) {
  const progress = useSharedValue(WEDGED);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Writing a shared value during render warns, so the loop starts here.
    if (reduceMotion) {
      // Park the ball in the wedged pose. The loader still reads as the logo,
      // it just does not travel.
      progress.value = WEDGED;
      return;
    }

    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [reduceMotion, progress]);

  const ballSize = BALL_BOX.size * size;

  const ballStyle = useAnimatedStyle(() => {
    const frame = interpolate(progress.value, CLOCK.input, CLOCK.output);

    return {
      opacity: interpolate(frame, STOPS, OPACITY),
      transform: [
        { scale: interpolate(frame, STOPS, SCALE) },
        { translateX: interpolate(frame, STOPS, TX) * ballSize },
        { translateY: interpolate(frame, STOPS, TY) * ballSize },
      ],
    };
  });

  // Pull the box left of its own centre by however far the hoop sits from it,
  // so what lands in the middle of the layout is the hoop and not the artwork.
  const offset = (size * (1 + RUN_UP)) / 2 - HOOP_CENTRE * size;

  return (
    <View
      style={[
        styles.court,
        {
          width: size * (1 + RUN_UP),
          height: size,
          marginRight: -2 * offset,
        },
      ]}
      pointerEvents="none"
      accessible={false}
    >
      <Svg
        width={BACKBOARD_BOX.width * size}
        height={BACKBOARD_BOX.height * size}
        viewBox={BACKBOARD_VIEWBOX}
        style={{
          position: "absolute",
          left: BACKBOARD_BOX.left * size,
          top: BACKBOARD_BOX.top * size,
        }}
      >
        {BACKBOARD_PATHS.map((d, i) => (
          <Path
            key={i}
            d={d}
            fill={i === 0 ? BACKBOARD_FRAME : colors.yellow}
          />
        ))}
      </Svg>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: BALL_BOX.left * size,
            top: BALL_BOX.top * size,
            width: ballSize,
            height: ballSize,
          },
          ballStyle,
        ]}
      >
        <Svg width={ballSize} height={ballSize} viewBox={BALL_VIEWBOX}>
          <Circle cx={282.1} cy={282.1} r={282.03} fill={colors.darkpurple} />
          {BALL_PATHS.map((d, i) => (
            <Path key={i} d={d} fill={BALL_SEAMS} />
          ))}
        </Svg>
      </Animated.View>

      <Svg
        width={RIM_BOX.width * size}
        height={RIM_BOX.height * size}
        viewBox={RIM_VIEWBOX}
        style={{
          position: "absolute",
          left: RIM_BOX.left * size,
          top: RIM_BOX.top * size,
        }}
      >
        {RIM_PATHS.map((d, i) => (
          <Path key={i} d={d} fill={RIM_FILLS[i]} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  court: {
    // `.og-animation` clips its children, which is what hides the ball while it
    // is off to the right and after it has dropped through the floor. The web
    // version also paints itself darkpurple; left transparent here so the
    // loader sits on whatever surface it lands on, and every screen behind it
    // is already dark.
    overflow: "hidden",
    position: "relative",
  },
});
