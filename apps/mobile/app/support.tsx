import { Stack, useLocalSearchParams } from "expo-router";
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
import { CoffeeLeaderboard } from "@/components/CoffeeLeaderboard";
import { CoffeeNameCard } from "@/components/CoffeeNameCard";
import { CoffeeScoreboard } from "@/components/CoffeeScoreboard";
import { GradientFill, Grain } from "@/components/Gradient";
import { Screen } from "@/components/Screen";
import { StickerButton } from "@/components/StickerButton";
import { api } from "@/lib/api";
import { getInstallId } from "@/lib/coffee-board";
import { report, track } from "@/lib/observability";
import { useWide } from "@/lib/wide";
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
  | { kind: "thanks"; coffees: number; transaction: string | null }
  | { kind: "failed" }
  | { kind: "unavailable" };

/**
 * Port of apps/web/src/app/support-us: the coffee stack with its picks, then
 * the Coffees vs Wedgies scoreboard. The buy button always reads as the real
 * thing; the price joins it once the App Store has answered. If the store
 * can't sell right now (no connection), pressing it says so instead.
 */
export default function SupportScreen() {
  // Dev builds only: `?cups=5` opens on another pick, and `?thanks=3` on the
  // thanks and name card, for screenshots.
  const { cups, thanks } = useLocalSearchParams<{
    cups?: string;
    thanks?: string;
  }>();
  const { wide } = useWide();
  const [count, setCount] = useState<1 | 3 | 5>(() =>
    __DEV__ && (cups === "1" || cups === "5") ? (Number(cups) as 1 | 5) : 3,
  );
  const [status, setStatus] = useState<Status>(() =>
    __DEV__ && thanks
      ? { kind: "thanks", coffees: Number(thanks) || 1, transaction: "dev" }
      : { kind: "idle" },
  );
  const [checked, setChecked] = useState(false);
  const scoreboard = api.donations.getSeasonCoffees.useQuery(undefined, {
    retry: 1,
  });
  const board = api.donations.getCoffeeBoard.useQuery(undefined, {
    retry: 1,
  });
  const record = api.donations.recordAppStoreCoffee.useMutation();
  const recordRef = useRef(record.mutateAsync);
  recordRef.current = record.mutateAsync;
  const saveName = api.donations.saveAppBoardName.useMutation();
  // The name can only go on a purchase the server has counted, so saving it
  // waits for the purchase to be sent.
  const recorded = useRef<Promise<unknown>>(Promise.resolve());

  const onPurchase = async (purchase: Purchase) => {
    const coffees = COFFEES_OF.get(purchase.productId) ?? 0;
    track("wt_coffee_bought", { coffees });
    const transaction = purchase.purchaseToken ?? null;
    setStatus({
      kind: "thanks",
      coffees: coffees * (purchase.quantity || 1),
      transaction,
    });
    if (!transaction) return;
    const send = (async () => {
      const installId = await getInstallId();
      await recordRef.current({ signedTransaction: transaction, installId });
    })();
    recorded.current = send.catch(() => undefined);
    try {
      await send;
      // Finished only once the server has it. If it never heard, the store
      // hands the purchase back next time and it is sent again.
      await finishTransaction({ purchase, isConsumable: true });
      void scoreboard.refetch();
      void board.refetch();
    } catch (error) {
      report("coffee.record", error);
    }
  };

  const onSaveName =
    status.kind === "thanks" && status.transaction
      ? async (name: string) => {
          await recorded.current;
          const { saved } = await saveName.mutateAsync({
            signedTransaction: status.transaction!,
            name,
          });
          return saved;
        }
      : null;

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

  const buy = async () => {
    if (!product) {
      setStatus({ kind: "unavailable" });
      return;
    }
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

  const coffeesLabel = `Buy ${count} ${count === 1 ? "coffee" : "coffees"}`;
  const label =
    status.kind === "buying"
      ? "Opening the App Store…"
      : product
        ? `${coffeesLabel} · ${product.displayPrice}`
        : coffeesLabel;

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
        {wide ? (
          // The opened Duo: the cups and picks on the left half, buying and
          // the scoreboard on the right, meeting on the fold.
          <View style={styles.split}>
            <View style={styles.half}>
              <CoffeeStack count={count} tall={wide} />

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
            </View>
            <View style={[styles.half, styles.halfRight]}>
              {status.kind === "thanks" ? (
                <CoffeeNameCard coffees={status.coffees} onSave={onSaveName} />
              ) : null}

              <StickerButton
                label={label}
                onPress={() => void buy()}
                disabled={status.kind === "buying"}
              />
              <Text
                style={styles.small}
                allowFontScaling={false}
                accessibilityLiveRegion="polite"
              >
                {status.kind === "failed"
                  ? "That didn't go through. Nothing was charged. Try again in a moment."
                  : status.kind === "unavailable"
                    ? checked
                      ? "The App Store isn't answering right now. Try again in a moment."
                      : "Still loading the coffees. Try again in a moment."
                    : "Paid through the App Store"}
              </Text>

              {/* Not on every server yet, so a failure only hides the board. */}
              {scoreboard.error ? null : (
                <CoffeeScoreboard data={scoreboard.data ?? null} />
              )}
              {board.data ? <CoffeeLeaderboard board={board.data} /> : null}
            </View>
          </View>
        ) : (
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
              <CoffeeNameCard coffees={status.coffees} onSave={onSaveName} />
            ) : null}

            <StickerButton
              label={label}
              onPress={() => void buy()}
              disabled={status.kind === "buying"}
            />
            <Text
              style={styles.small}
              allowFontScaling={false}
              accessibilityLiveRegion="polite"
            >
              {status.kind === "failed"
                ? "That didn't go through. Nothing was charged. Try again in a moment."
                : status.kind === "unavailable"
                  ? checked
                    ? "The App Store isn't answering right now. Try again in a moment."
                    : "Still loading the coffees. Try again in a moment."
                  : "Paid through the App Store"}
            </Text>

            {/* Not on every server yet, so a failure only hides the board. */}
            {scoreboard.error ? null : (
              <CoffeeScoreboard data={scoreboard.data ?? null} />
            )}
            {board.data ? <CoffeeLeaderboard board={board.data} /> : null}
          </View>
        )}
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
 * badge in a pyramid, each new one dropping onto the stack, with a rotating
 * attribute boost in the corner.
 */
function CoffeeStack({
  count,
  tall = false,
}: {
  count: number;
  tall?: boolean;
}) {
  const attribute = useRotatingAttribute();
  const shown = useRef(count);
  const prev = shown.current;
  shown.current = count;

  // Only 1, 3 or 5 can be bought, so each gets a stack built to fill the
  // badge: one big cup, then pyramids of two under one and three under two.
  const size = count <= 1 ? 104 : count <= 3 ? 84 : 74;
  const rows: number[][] = [];
  for (let i = 0, width = Math.ceil(count / 2); i < count; width--) {
    const row: number[] = [];
    for (let j = 0; j < Math.max(1, width) && i < count; j++) row.push(i++);
    rows.push(row);
  }

  return (
    <View
      style={[styles.stack, tall && styles.stackTall]}
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
      <View style={styles.cups}>
        {rows.map((row, r) => (
          <View
            key={r}
            style={[
              styles.row,
              { gap: Math.round(size / 8) },
              // Each row sits down onto the lids of the one below.
              r > 0 && { marginBottom: -Math.round(size * 0.3) },
            ]}
          >
            {row.map((i) => (
              <Animated.View
                key={i}
                entering={
                  i >= prev
                    ? FadeInDown.springify()
                        .damping(14)
                        .delay(Math.max(0, i - prev) * 90)
                    : undefined
                }
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
  stackTall: { height: 320 },
  split: { flexDirection: "row", gap: 36, marginTop: 20 },
  half: { flex: 1, gap: 16 },
  halfRight: { justifyContent: "center" },
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
    flexDirection: "column-reverse",
    alignItems: "center",
  },
  row: { flexDirection: "row", justifyContent: "center" },

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

  small: {
    marginTop: -4,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.cream50,
  },
});
