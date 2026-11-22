import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

/**
 * Opens a web link outside the app: the matching app if one claims it (X,
 * YouTube, Bluesky), otherwise Safari. Some phones refuse the hand-off, for
 * example when Screen Time blocks the site, and the tap then did nothing at
 * all. Those links open in an in-app browser instead.
 */
export async function openExternal(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      // Nothing left to try; the tap does nothing, as it did before.
    }
  }
}
