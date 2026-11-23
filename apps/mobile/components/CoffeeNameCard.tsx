import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { StickerButton } from "@/components/StickerButton";
import {
  BOARD_NAME_MAX,
  getSavedBoardName,
  rememberBoardName,
} from "@/lib/coffee-board";
import { getApiBaseUrl } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

type State =
  | { kind: "editing" }
  | { kind: "saving" }
  | { kind: "saved"; named: boolean }
  | { kind: "test" }
  | { kind: "failed" };

/**
 * The thanks after buying, with the leaderboard name under it: the app's
 * version of the website's thanks page. The name is optional and waits for
 * approval. The morning recap isn't collected here: it links to the
 * website's sign-up, so the app never handles an email address.
 */
export function CoffeeNameCard({
  coffees,
  onSave,
}: {
  coffees: number;
  /** Saves the name; resolves false when the purchase isn't on the board. */
  onSave: ((name: string) => Promise<boolean>) | null;
}) {
  const [name, setName] = useState("");
  const [state, setState] = useState<State>({ kind: "editing" });

  useEffect(() => {
    let live = true;
    void getSavedBoardName().then((saved) => {
      if (live && saved) setName((n) => n || saved);
    });
    return () => {
      live = false;
    };
  }, []);

  const trimmed = name.trim();

  const save = async () => {
    if (!onSave) return;
    setState({ kind: "saving" });
    try {
      const ok = await onSave(trimmed);
      if (!ok) {
        setState({ kind: "test" });
        return;
      }
      await rememberBoardName(trimmed);
      setState({ kind: "saved", named: trimmed.length > 0 });
    } catch {
      setState({ kind: "failed" });
    }
  };

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.title} allowFontScaling={false}>
        Thank you!
      </Text>
      <Text style={styles.text} allowFontScaling={false}>
        {coffees === 1
          ? "That coffee keeps the tracker running."
          : `Those ${coffees} coffees keep the tracker running.`}
      </Text>

      {onSave ? (
        <View style={styles.form}>
          <Text style={styles.label} nativeID="board-name-label">
            Your name on the coffee leaderboard
          </Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (state.kind !== "saving") setState({ kind: "editing" });
            }}
            maxLength={BOARD_NAME_MAX}
            placeholder="Anonymous"
            placeholderTextColor="rgba(240, 225, 182, 0.35)"
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="nickname"
            returnKeyType="done"
            onSubmitEditing={() => void save()}
            accessibilityLabelledBy="board-name-label"
            style={styles.input}
          />
          <View style={styles.hintRow}>
            <Text style={styles.hint}>
              Leave it empty to stay anonymous. Names show once they&apos;re
              approved.
            </Text>
            <Text style={styles.hint} allowFontScaling={false}>
              {name.length}/{BOARD_NAME_MAX}
            </Text>
          </View>
          <StickerButton
            label={
              state.kind === "saving"
                ? "Saving…"
                : trimmed
                  ? "Put my name on the board"
                  : "Save"
            }
            onPress={() => void save()}
            disabled={state.kind === "saving"}
          />
          {state.kind !== "editing" && state.kind !== "saving" ? (
            <Text
              style={[styles.result, state.kind === "failed" && styles.error]}
            >
              {state.kind === "saved"
                ? state.named
                  ? "Saved. Your name shows on the board once it's approved."
                  : "Saved. Your coffees stay anonymous."
                : state.kind === "test"
                  ? "Test purchases don't go on the board."
                  : "Couldn't save that. Try again in a moment."}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => void Linking.openURL(`${getApiBaseUrl()}/#newsletter`)}
        accessibilityRole="link"
        hitSlop={8}
        style={({ pressed }) => [styles.recap, pressed && styles.pressed]}
      >
        <Text style={styles.recapText}>
          Get the morning recap after each wedgie
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(240, 225, 182, 0.35)",
    backgroundColor: colors.violet15,
  },
  title: { fontFamily: fonts.black, fontSize: 18, color: colors.cream },
  text: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream80,
  },
  form: { marginTop: 14, gap: 8 },
  label: { fontFamily: fonts.black, fontSize: 15, color: colors.cream },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(154, 92, 245, 0.4)",
    backgroundColor: colors.night,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.cream,
  },
  hintRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  hint: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(240, 225, 182, 0.55)",
  },
  result: {
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.cream80,
  },
  error: { color: colors.shot },
  recap: { marginTop: 14, alignSelf: "center" },
  pressed: { opacity: 0.6 },
  recapText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: colors.cream,
    textDecorationLine: "underline",
  },
});
