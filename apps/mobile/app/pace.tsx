import { Stack, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GradientFill } from "@/components/Gradient";
import { PageHeading } from "@/components/PageHeading";
import { Screen } from "@/components/Screen";
import { ErrorState } from "@/components/States";
import { StickerButton } from "@/components/StickerButton";
import { api, type RouterOutputs } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";
import { useWide } from "@/lib/wide";
import {
  PRIOR_GAMES,
  RECENCY,
  SEASON_GAMES,
  blendedRate,
  computePace,
  normalRate,
} from "@wedgietracker/core/utils/paceCalculator";

type PaceData = RouterOutputs["wedgie"]["getPaceBreakdown"];

/**
 * The pace the server stores, worked out the same way (server/pace.ts).
 * computePace has no answer before the first game, when the pace is simply
 * this season's wedgies plus a full season at the normal rate.
 */
function paceFor(rates: number[], wedgies: number, games: number) {
  if (games <= 0) return Math.round(wedgies + normalRate(rates) * SEASON_GAMES);
  return computePace({
    currentTotalWedgies: wedgies,
    currentTotalGames: games,
    seasonRates: rates,
  }).medianPace;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Port of apps/web/src/app/stats-for-nerds/pace and PaceExplainer.tsx: how
 * the pace is worked out, step by step, with a calculator to try it.
 * Reached from the pace gauge on Home and on Stats.
 */
export default function PaceScreen() {
  const pace = api.wedgie.getPaceBreakdown.useQuery();

  return (
    <>
      <Stack.Screen options={{ headerBackTitle: "Back" }} />
      <Screen
        underHeader
        heading={<PageHeading title="How the pace works" />}
        refreshControl={
          <RefreshControl
            refreshing={pace.isRefetching}
            onRefresh={() => void pace.refetch()}
            tintColor={colors.cream}
          />
        }
      >
        {pace.error ? (
          <ErrorState onRetry={() => void pace.refetch()} />
        ) : pace.data ? (
          <Explainer data={pace.data} />
        ) : (
          <View style={styles.body}>
            {[90, 420, 200, 260].map((height, i) => (
              <View key={i} style={[styles.placeholder, { height }]} />
            ))}
          </View>
        )}
      </Screen>
    </>
  );
}

function Explainer({ data }: { data: PaceData }) {
  const router = useRouter();
  const { wide } = useWide();
  const { seasons } = data;
  const rates = seasons.map((s) => s.wedgies / s.games);
  const normal = normalRate(rates);
  const normalSeason = normal * SEASON_GAMES;
  const most = Math.max(...seasons.map((s) => s.wedgies), 1);
  // Last season counts in full, each one before it RECENCY times the next.
  const weightOf = (i: number) => RECENCY ** (seasons.length - 1 - i);
  const madeUp = PRIOR_GAMES * normal;

  const [games, setGames] = useState(data.gamesPlayed);
  const [wedgies, setWedgies] = useState(data.wedgiesThisSeason);
  const left = Math.max(0, SEASON_GAMES - games);
  const rate = blendedRate(wedgies, games, rates);
  const pace = paceFor(rates, wedgies, games);
  const isToday =
    games === data.gamesPlayed && wedgies === data.wedgiesThisSeason;

  return (
    <View style={styles.body}>
      <Text style={styles.intro} allowFontScaling={false}>
        The pace is our guess at how many wedgies the{" "}
        <Text style={styles.strong}>{data.currentSeason}</Text> season will
        finish with.
      </Text>

      <Section step="1" title="A normal season">
        <P>
          Over the last <Hi>{seasons.length} completed seasons</Hi>, with recent
          ones counting a bit more, a normal season works out at one wedgie
          every <Hi>{Math.round(1 / normal)} games</Hi>.
        </P>
        <View style={styles.seasons}>
          {seasons.map((s, i) => (
            <View
              key={s.name}
              style={styles.seasonRow}
              accessible
              accessibilityLabel={`${s.name}: ${s.wedgies} wedgies, counts ${pct(weightOf(i))}`}
            >
              <Text style={styles.seasonName} allowFontScaling={false}>
                {s.name}
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    (rates[i] ?? 0) >= normal ? styles.above : styles.below,
                    {
                      width: `${(s.wedgies / most) * 100}%`,
                      opacity: 0.35 + 0.65 * weightOf(i),
                    },
                  ]}
                />
                <View
                  style={[
                    styles.normalLine,
                    { left: `${(normalSeason / most) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.seasonCount} allowFontScaling={false}>
                {s.wedgies}
              </Text>
              <Text style={styles.seasonWeight} allowFontScaling={false}>
                {pct(weightOf(i))}
              </Text>
            </View>
          ))}
        </View>
        <Note>
          Each season&apos;s wedgies are divided by the games it actually
          played, so the shortened 2019/20 and 2020/21 seasons count by how
          often wedgies happened, not by their smaller totals. Last season
          counts in full, the one before at 80%, then 64%, and so on, as the
          percentages on the right show. Cream seasons had wedgies more often
          than normal, violet ones less. The white line is a normal season,
          about {Math.round(normalSeason)} wedgies.
        </Note>
      </Section>

      <Section step="2" title="The season so far">
        <P>
          <Hi>{data.wedgiesThisSeason}</Hi>{" "}
          {data.wedgiesThisSeason === 1 ? "wedgie" : "wedgies"} in{" "}
          <Hi>{fmt(data.gamesPlayed)}</Hi> games, out of an estimated{" "}
          {fmt(SEASON_GAMES)} for the whole season. That leaves about{" "}
          <Hi>{fmt(Math.max(0, SEASON_GAMES - data.gamesPlayed))} games</Hi> to
          play.
        </P>
        <Note>
          The total is an estimate. The 1,230 regular-season games are fixed,
          but how many play-in and playoff games there will be isn&apos;t known
          until the season ends.
        </Note>
      </Section>

      <Section step="3" title="Mix in this season">
        <P>
          {fmt(games)} {games === 1 ? "game is" : "games is"} too small a sample
          to trust on its own, so past seasons get a say worth{" "}
          {fmt(PRIOR_GAMES)} games, about half a season. The season starts off
          with {fmt(PRIOR_GAMES)} made-up games at the normal rate, and the real
          games go on top.
        </P>
        <Sum wide={wide}>
          <Step>
            <Term
              value={`${Math.round(madeUp)} in ${fmt(PRIOR_GAMES)}`}
              label="made-up wedgies in games"
            />
          </Step>
          <Step op="+">
            <Term
              value={`${wedgies} in ${fmt(games)}`}
              label="real wedgies in games"
            />
          </Step>
          <Step op="=">
            <Term
              value={`1 in ${Math.round(1 / rate)}`}
              label="wedgies a game"
              highlight
            />
          </Step>
        </Sum>
        <Note>
          {Math.round(madeUp)} + {wedgies} = {Math.round(madeUp + wedgies)}{" "}
          wedgies in {fmt(PRIOR_GAMES)} + {fmt(games)} ={" "}
          {fmt(PRIOR_GAMES + games)} games. The made-up games always stay{" "}
          {fmt(PRIOR_GAMES)}, while the real ones keep growing. Early on the
          past has most of the say, around midseason they count about the same,
          and by the end it is mostly this season.
        </Note>
      </Section>

      <Section step="4" title="Put together">
        <P>
          The games still to play go at that mixed rate, on top of this
          season&apos;s wedgies so far. Move the numbers below to try it.
        </P>
        <Sum wide={wide}>
          <Step>
            <Term value={String(wedgies)} label="wedgies so far" />
          </Step>
          <Step op="+">
            <View style={styles.group}>
              <Op>(</Op>
              <Term value={fmt(left)} label="games left (est.)" />
              <Op>÷</Op>
              <Term
                value={String(Math.round(1 / rate))}
                label="games a wedgie"
              />
              <Op>)</Op>
            </View>
          </Step>
          <Step op="=">
            <Term value={String(pace)} label="pace" highlight />
          </Step>
        </Sum>
        <Text style={styles.small} allowFontScaling={false}>
          Rounded to whole numbers here. The pace uses the exact ones.
        </Text>

        <View style={styles.divider} />

        <View style={styles.control}>
          <Text style={styles.controlLabel} allowFontScaling={false}>
            Games played
          </Text>
          <Text style={styles.controlValue} allowFontScaling={false}>
            {fmt(games)}
          </Text>
        </View>
        <Slider
          value={games}
          max={SEASON_GAMES}
          onChange={setGames}
          label="Games played"
        />

        <View style={[styles.control, styles.controlGap]}>
          <Text style={styles.controlLabel} allowFontScaling={false}>
            Wedgies so far
          </Text>
          <View style={styles.stepper}>
            <Round
              label="One fewer wedgie"
              onPress={() => setWedgies((w) => Math.max(0, w - 1))}
            >
              −
            </Round>
            <Text style={styles.stepperValue} allowFontScaling={false}>
              {wedgies}
            </Text>
            <Round
              label="One more wedgie"
              onPress={() => setWedgies((w) => Math.min(200, w + 1))}
            >
              +
            </Round>
          </View>
        </View>

        <Pressable
          disabled={isToday}
          onPress={() => {
            setGames(data.gamesPlayed);
            setWedgies(data.wedgiesThisSeason);
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.today,
            isToday && styles.todayOff,
            pressed && styles.todayPressed,
          ]}
        >
          <Text style={styles.todayText} allowFontScaling={false}>
            Back to today
          </Text>
        </Pressable>
      </Section>

      <Section title="Why it works this way">
        {[
          "We tested it on the 12 seasons from 2014/15 to 2025/26. At many points in each season, from the first weeks to the playoffs, we worked out what this pace would have said back then and compared it with how many wedgies that season actually finished with. On average it was about 4 wedgies off.",
          "Going by this season alone jumps around too much early on. In the first part of a season it misses by around 15 wedgies.",
          "Ignoring this season until the end misses too. Averaging past seasons alone ends up about 5 off.",
          "Early in any season every formula can be quite a bit off. The more games are played, the closer the pace gets to the final number.",
          `${fmt(SEASON_GAMES)} games is an estimate of a full season the way we count it, the 1,230 regular-season games plus a typical play-in and playoffs.`,
        ].map((text) => (
          <View key={text.slice(0, 20)} style={styles.bullet}>
            <Text style={styles.bulletDot} allowFontScaling={false}>
              •
            </Text>
            <Text style={styles.bulletText} allowFontScaling={false}>
              {text}
            </Text>
          </View>
        ))}
      </Section>

      <StickerButton label="Back" onPress={() => router.back()} />
    </View>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        {step ? (
          <View style={styles.stepBadge}>
            <GradientFill name="button" radius={17} />
            <Text style={styles.stepText} allowFontScaling={false}>
              {step}
            </Text>
          </View>
        ) : null}
        <Text
          style={styles.sectionTitle}
          accessibilityRole="header"
          allowFontScaling={false}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.p} allowFontScaling={false}>
      {children}
    </Text>
  );
}

function Hi({ children }: { children: React.ReactNode }) {
  return <Text style={styles.strong}>{children}</Text>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.note} allowFontScaling={false}>
      {children}
    </Text>
  );
}

/** The steps of a sum: stacked with the operator on the left, or in a row. */
function Sum({ wide, children }: { wide: boolean; children: React.ReactNode }) {
  return <View style={[styles.sum, wide && styles.sumWide]}>{children}</View>;
}

function Step({ op, children }: { op?: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.opCol}>{op ? <Op>{op}</Op> : null}</View>
      {children}
    </View>
  );
}

function Term({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.term}>
      <View style={[styles.termBox, highlight && styles.termBoxOn]}>
        <Text
          style={[styles.termValue, highlight && styles.termValueOn]}
          allowFontScaling={false}
        >
          {value}
        </Text>
      </View>
      <Text style={styles.termLabel} allowFontScaling={false}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function Op({ children }: { children: string }) {
  return (
    <Text style={styles.op} allowFontScaling={false}>
      {children}
    </Text>
  );
}

function Round({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.round, pressed && styles.roundPressed]}
    >
      <Text style={styles.roundText} allowFontScaling={false}>
        {children}
      </Text>
    </Pressable>
  );
}

/**
 * A plain slider, dragged or tapped along its track, with VoiceOver's
 * adjustable actions moving it by ten games.
 */
function Slider({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
}) {
  const width = useRef(0);
  const latest = useRef(onChange);
  latest.current = onChange;
  const set = (x: number) => {
    if (!width.current) return;
    const ratio = Math.min(1, Math.max(0, x / width.current));
    latest.current(Math.round(ratio * max));
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Keep the drag even if the finger wanders off vertically.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => set(e.nativeEvent.locationX),
      onPanResponderMove: (e) => set(e.nativeEvent.locationX),
    }),
  ).current;
  const ratio = max ? value / max : 0;

  return (
    <View
      style={styles.slider}
      onLayout={(e) => (width.current = e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) =>
        onChange(
          Math.min(
            max,
            Math.max(
              0,
              value + (e.nativeEvent.actionName === "increment" ? 10 : -10),
            ),
          ),
        )
      }
      {...pan.panHandlers}
    >
      <View style={styles.sliderTrack} pointerEvents="none">
        <View style={[styles.sliderFill, { width: `${ratio * 100}%` }]}>
          <GradientFill name="button" radius={3} />
        </View>
      </View>
      <View
        pointerEvents="none"
        style={[styles.knob, { left: `${ratio * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { marginTop: 24, gap: 16 },
  placeholder: { borderRadius: 22, backgroundColor: "rgba(29, 18, 66, 0.6)" },
  intro: {
    textAlign: "center",
    fontFamily: fonts.extraBold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.cream80,
  },
  strong: { fontFamily: fonts.black, color: colors.cream },

  section: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.violet20,
    backgroundColor: colors.panel,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  // A little right padding keeps the slanted digit looking centred.
  stepText: {
    fontFamily: fonts.blackItalic,
    fontSize: 18,
    paddingRight: 2,
    color: colors.cream,
  },
  sectionTitle: {
    flexShrink: 1,
    fontFamily: fonts.black,
    fontSize: 21,
    letterSpacing: -0.2,
    color: colors.cream,
  },
  p: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.cream80,
  },
  note: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.cream50,
  },
  small: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.cream50,
  },

  seasons: { marginTop: 14, gap: 6 },
  seasonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  seasonName: {
    width: 62,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.cream70,
  },
  track: { flex: 1, height: 20 },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  above: { backgroundColor: colors.cream },
  below: { backgroundColor: colors.violet },
  normalLine: {
    position: "absolute",
    top: -3,
    bottom: -3,
    width: 2,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  seasonCount: {
    width: 30,
    textAlign: "right",
    fontFamily: fonts.black,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    color: colors.cream,
  },
  seasonWeight: {
    width: 38,
    textAlign: "right",
    fontFamily: fonts.bold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    color: colors.cream50,
  },

  sum: { marginTop: 16, gap: 12 },
  sumWide: { flexDirection: "row", justifyContent: "center", gap: 8 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  opCol: { width: 20 },
  group: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  op: {
    paddingTop: 4,
    textAlign: "center",
    fontFamily: fonts.black,
    fontSize: 24,
    color: colors.violet,
  },
  term: { alignItems: "center", maxWidth: 110 },
  termBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.night,
  },
  termBoxOn: { backgroundColor: colors.cream },
  termValue: {
    fontFamily: fonts.black,
    fontSize: 22,
    lineHeight: 30,
    fontVariant: ["tabular-nums"],
    color: colors.cream,
  },
  termValueOn: { color: colors.night },
  termLabel: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: colors.cream50,
  },

  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: "rgba(240, 225, 182, 0.1)",
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlGap: { marginTop: 24 },
  controlLabel: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.cream,
  },
  controlValue: { fontFamily: fonts.black, fontSize: 18, color: colors.cream },
  slider: { height: 44, justifyContent: "center" },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: colors.violet20,
  },
  sliderFill: { height: "100%" },
  knob: {
    position: "absolute",
    width: 26,
    height: 26,
    marginLeft: -13,
    borderRadius: 13,
    backgroundColor: colors.cream,
    shadowColor: "#050214",
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperValue: {
    width: 44,
    textAlign: "center",
    fontFamily: fonts.black,
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    color: colors.cream,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(240, 225, 182, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundPressed: { backgroundColor: colors.violet20 },
  roundText: { fontFamily: fonts.black, fontSize: 20, color: colors.cream },
  today: {
    alignSelf: "center",
    marginTop: 24,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  todayOff: { opacity: 0.4 },
  todayPressed: { backgroundColor: colors.violet20 },
  todayText: { fontFamily: fonts.extraBold, fontSize: 14, color: colors.cream },

  bullet: { flexDirection: "row", gap: 8, marginTop: 8 },
  bulletDot: { fontFamily: fonts.black, fontSize: 15, color: colors.violet },
  bulletText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.cream80,
  },
});
