import { Stack } from "expo-router";
import {
  isUserCancelledError,
  useIAP,
  type Product,
  type Purchase,
} from "expo-iap";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { CoffeeCup } from "@/components/CoffeeCup";
import { CoffeeScoreboard } from "@/components/CoffeeScoreboard";
import { GradientFill, Grain } from "@/components/Gradient";
import { Screen } from "@/components/Screen";
import { StickerButton } from "@/components/StickerButton";
import { api } from "@/lib/api";
import { report, track } from "@/lib/observability";
import { colors, fonts } from "@/lib/theme";

/**
 * The coffees, as consumable in-app purchases. Prices come from the App
 * Store, so they follow the buyer's storefront. The server counts a coffee
 * from its signed transaction (donations.recordAppStoreCoffee), and only
 * real App Store purchases count: sandbox and TestFlight ones never do.
 */
const PRODUCTS = [
  { id: "com.wedgietracker.app.coffee1", coffees: 1 },
  { id: "com.wedgietracker.app.coffee3", coffees: 3 },
  { id: "com.wedgietracker.app.coffee5", coffees: 5 },
] as const;
const COFFEES_OF = new Map<string, number>(
  PRODUCTS.map((p) => [p.id, p.coffees]),
);

/** The boosts a round of coffees gives me, like a player's ratings. */
const ATTRIBUTES: { name: string; down?: boolean }[] = [
  { name: "Ball handle", down: true },
  { name: "Rebound" },
  { name: "Block" },
  { name: "Steal" },
  { name: "Speed" },
  { name: "Vertical" },
  { name: "Hustle" },
  { name: "Clutch", down: true },
  // Wedgie watching has its costs.
  { name: "Basketball IQ", down: true },
  { name: "Shooting", down: true },
  { name: "Sleep", down: true },
  { name: "Shot selection", down: true },
];

type Status =
  | { kind: "idle" }
  | { kind: "buying" }
  | { kind: "thanks"; coffees: number }
  | { kind: "failed" };

/**
 * Port of apps/web/src/app/support-us: the coffee stack with its picks, then
 * the Coffees vs Wedgies scoreboard. When the store has no coffees to sell
 * (not set up yet, or no connection) the stack and scoreboard still show and
 * the button says coffees are coming soon.
 */
export default function SupportScreen() {
  const [count, setCount] = useState<1 | 3 | 5>(3);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [checked, setChecked] = useState(false);
  const scoreboard = api.donations.getSeasonCoffees.useQuery(undefined, {
    retry: 1,
  });
  const record = api.donations.recordAppStoreCoffee.useMutation();
  const recordRef = useRef(record.mutateAsync);
  recordRef.current = record.mutateAsync;

  const onPurchase = async (purchase: Purchase) => {
    const coffees = COFFEES_OF.get(purchase.productId) ?? 0;
    track("wt_coffee_bought", { coffees });
    setStatus({ kind: "thanks", coffees: coffees * (purchase.quantity || 1) });
    if (!purchase.purchaseToken) return;
    try {
      await recordRef.current({ signedTransaction: purchase.purchaseToken });
      // Finished only once the server has it. If it never heard, the store
      // hands the purchase back next time and it is sent again.
      await finishTransaction({ purchase, isConsumable: true });
      void scoreboard.refetch();
    } catch (error) {
      report("coffee.record", error);
    }
  };

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: (purchase) => void onPurchase(purchase),
    onPurchaseError: (error) => {
      if (isUserCancelledError(error)) {
        setStatus({ kind: "idle" });
        return;
      }
      report("coffee.purchase", error);
      setStatus({ kind: "failed" });
    },
    onError: (error) => report("coffee.store", error),
  });

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: PRODUCTS.map((p) => p.id), type: "in-app" })
      .catch((error: unknown) => report("coffee.products", error))
      .finally(() => setChecked(true));
  }, [connected, fetchProducts]);

  // Without a store connection there is nothing to wait for after a moment.
  useEffect(() => {
    const timer = setTimeout(() => setChecked(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const product = products.find(
    (p: Product) => p.id === PRODUCTS.find((x) => x.coffees === count)?.id,
  );
  const available = PRODUCTS.every((p) =>
    products.some((x: Product) => x.id === p.id),
  );

  const buy = async () => {
    if (!product) return;
    setStatus({ kind: "buying" });
    try {
      await requestPurchase({
        request: { apple: { sku: product.id } },
        type: "in-app",
      });
    } catch (error) {
      if (!isUserCancelledError(error as Error)) {
        report("coffee.request", error);
        setStatus({ kind: "failed" });
      } else {
        setStatus({ kind: "idle" });
      }
    }
  };

  const label =
    status.kind === "buying"
      ? "Opening the App Store…"
      : available && product
        ? `Buy ${count} ${count === 1 ? "coffee" : "coffees"} · ${product.displayPrice}`
        : checked
          ? "Coffees in the app are coming soon"
          : "Loading coffees…";

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: "Back" }} />
      <Screen
        underHeader
        heading={
          <View>
            <Text
              style={styles.title}
              accessibilityRole="header"
              allowFontScaling={false}
            >
              Buy me a coffee
            </Text>
            <Text style={styles.intro} allowFontScaling={false}>
              WedgieTracker is one person in London, logging every wedgie since
              2014/15. Coffees keep the tracker running.
            </Text>
          </View>
        }
      >
        <View style={styles.body}>
          <CoffeeStack count={count} />

          <View
            style={styles.picks}
            accessibilityRole="radiogroup"
            accessibilityLabel="How many coffees"
          >
            {PRODUCTS.map(({ coffees }) => {
              const on = count === coffees;
              return (
                <Pressable
                  key={coffees}
                  onPress={() => setCount(coffees)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${coffees} ${coffees === 1 ? "coffee" : "coffees"}`}
                  accessibilityState={{ checked: on }}
                  style={({ pressed }) => [
                    styles.pick,
                    on && styles.pickOn,
                    pressed && !on && styles.pickPressed,
                  ]}
                >
                  <Text
                    style={[styles.pickText, on && styles.pickTextOn]}
                    allowFontScaling={false}
                  >
                    {coffees}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {status.kind === "thanks" ? (
            <View style={styles.thanks} accessibilityLiveRegion="polite">
              <Text style={styles.thanksTitle} allowFontScaling={false}>
                Thank you!
              </Text>
              <Text style={styles.thanksText} allowFontScaling={false}>
                {status.coffees === 1
                  ? "That coffee keeps the tracker running."
                  : `Those ${status.coffees} coffees keep the tracker running.`}
              </Text>
            </View>
          ) : null}

          <View style={!available && styles.soon}>
            <StickerButton
              label={label}
              onPress={() => void buy()}
              disabled={!available || status.kind === "buying"}
              variant={available ? "violet" : "flat"}
            />
          </View>
          <Text style={styles.small} allowFontScaling={false}>
            {status.kind === "failed"
              ? "That didn't go through. Nothing was charged. Try again in a moment."
              : available
                ? "Paid through the App Store"
                : "They will be paid through the App Store."}
          </Text>

          {/* Not on every server yet, so a failure only hides the board. */}
          {scoreboard.error ? null : (
            <CoffeeScoreboard data={scoreboard.data ?? null} />
          )}
        </View>
      </Screen>
    </>
  );
}

/**
 * Cycles through the attributes in a fresh random order each visit, every
 * 1.8 seconds.
 */
function useRotatingAttribute() {
  const [order] = useState(() => {
    const shuffled = [...ATTRIBUTES];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  });
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % ATTRIBUTES.length),
      1800,
    );
    return () => clearInterval(timer);
  }, []);
  return order[index]!;
}

/**
 * Port of apps/web/src/components/support/CoffeeStack.tsx: the cups on the
 * badge, four high, each new one dropping onto the stack, with a rotating
 * attribute boost in the corner.
 */
function CoffeeStack({ count }: { count: number }) {
  const attribute = useRotatingAttribute();
  const shown = useRef(count);
  const prev = shown.current;
  shown.current = count;

  const size = 40;
  const high = 4;
  const columns: number[][] = [];
  for (let i = 0; i < count; i++)
    (columns[Math.floor(i / high)] ??= []).push(i);

  return (
    <View
      style={styles.stack}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${count} ${count === 1 ? "coffee" : "coffees"}`}
    >
      <GradientFill name="badge" radius={22} />
      <Grain radius={22} />
      <View style={styles.attribute}>
        <Text style={styles.attributeName} allowFontScaling={false}>
          {attribute.name}
        </Text>
        <View style={[styles.boost, attribute.down && styles.boostDown]}>
          <Text style={styles.boostText} allowFontScaling={false}>
            {attribute.down ? "−" : "+"}
            {count}
          </Text>
        </View>
      </View>
      <View style={[styles.cups, { gap: Math.round(size / 6) }]}>
        {columns.map((col, c) => (
          <View key={c} style={styles.column}>
            {col.map((i) => (
              <Animated.View
                key={i}
                entering={
                  i >= prev
                    ? FadeInDown.springify()
                        .damping(14)
                        .delay(Math.max(0, i - prev) * 90)
                    : undefined
                }
                style={{ marginTop: -Math.round(size * 0.225) }}
              >
                <CoffeeCup width={size} full steam={i === count - 1} />
              </Animated.View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.black,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.9,
    color: colors.cream,
  },
  intro: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 23,
    color: colors.cream70,
  },
  body: { marginTop: 20, gap: 16, width: "100%", maxWidth: 560 },

  // `bg-badge grain relative h-[250px] rounded-[22px]`
  stack: { height: 250, borderRadius: 22, overflow: "hidden" },
  attribute: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attributeName: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: colors.cream,
  },
  boost: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.cream,
  },
  boostDown: { backgroundColor: "#FF6FD8" },
  boostText: { fontFamily: fonts.black, fontSize: 14, color: colors.night },
  cups: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  column: { flexDirection: "column-reverse", alignItems: "center" },

  picks: { flexDirection: "row", justifyContent: "center", gap: 8 },
  pick: {
    minWidth: 52,
    minHeight: 48,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(240, 225, 182, 0.35)",
  },
  pickOn: { backgroundColor: colors.cream, borderColor: colors.cream },
  pickPressed: { backgroundColor: "rgba(240, 225, 182, 0.1)" },
  pickText: { fontFamily: fonts.black, fontSize: 17, color: colors.cream },
  pickTextOn: { color: colors.night },

  soon: { opacity: 0.6 },
  small: {
    marginTop: -4,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.cream50,
  },
  thanks: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(240, 225, 182, 0.35)",
    backgroundColor: colors.violet15,
  },
  thanksTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.cream },
  thanksText: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream80,
  },
});
