import { View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Top safe-area padding for a tab screen, laid out on the very first frame.
 *
 * `SafeAreaView` measures its own inset natively once its view is in the
 * window. Tabs mount lazily, so on a tab's first visit it drew one frame with
 * no top inset and then dropped everything by the status bar's height: a
 * flash of the whole screen jumping. The root provider already knows the
 * insets, so padding from its context is right before anything is drawn.
 *
 * The sides are padded too. On the iPhone Duo the status bar and the tab bar
 * sit in a column down the right edge, and without this the content runs
 * under them. On other iPhones in portrait both side insets are 0.
 */
export function TopSafeArea({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const { top, left, right } = useSafeAreaInsets();
  return (
    <View
      style={[
        { flex: 1, paddingTop: top, paddingLeft: left, paddingRight: right },
        style,
      ]}
    >
      {children}
    </View>
  );
}
