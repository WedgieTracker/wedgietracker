import * as Sentry from "@sentry/react-native";
import { usePathname } from "expo-router";
import PostHog from "posthog-react-native";
import { useEffect } from "react";

/**
 * Sentry for what breaks, PostHog for what people do.
 *
 * Both keys are client keys and ship inside the binary, so they arrive from
 * EXPO_PUBLIC_* rather than being written here: the repo is public and an
 * exposed DSN is an invitation to send junk events.
 */
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

/**
 * Off in development so a debugging session never lands in the live data. Set
 * EXPO_PUBLIC_TELEMETRY_IN_DEV=1 to verify a change end to end, which is worth
 * doing at least once: an integration that silently captures nothing looks
 * exactly like an app that never failed.
 */
const ENABLED = !__DEV__ || process.env.EXPO_PUBLIC_TELEMETRY_IN_DEV === "1";

/* -------------------------------------------------------------------------- */
/* Sentry                                                                      */
/* -------------------------------------------------------------------------- */

export function initSentry(): void {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: ENABLED,
    environment: __DEV__ ? "development" : "production",

    // No IP address, no cookies, no user. There are no accounts in this app,
    // so the only way an identifier could reach Sentry is if we put it there.
    sendDefaultPii: false,

    // Tracing, profiling and replay all stay off. That is a deliberate choice
    // rather than a default: it keeps the App Store privacy declaration to
    // Crash Data alone, and it is a line you can read in a diff.
    tracesSampleRate: 0,
    enableNativeFramesTracking: false,

    beforeSend(event) {
      event.user = undefined;
      if (event.request) event.request.cookies = undefined;
      return event;
    },
  });
}

type ErrorShape = { kind: string; code?: string; status?: number };

/**
 * Reduce any thrown value to type, code and status, and nothing else.
 *
 * Errors carry more than they look like they do: a fetch failure can hold the
 * whole request, and interpolating one into a message is how identifiers end
 * up in an issue title, where `beforeSend` cannot reach them.
 */
export function describeError(error: unknown): ErrorShape {
  if (typeof error === "object" && error !== null) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data !== null) {
      const code = (data as { code?: unknown }).code;
      const status = (data as { httpStatus?: unknown }).httpStatus;
      if (typeof code === "string" || typeof status === "number") {
        return {
          kind: "trpc",
          code: typeof code === "string" ? code : undefined,
          status: typeof status === "number" ? status : undefined,
        };
      }
    }
  }
  if (error instanceof Error) return { kind: error.name || "Error" };
  return { kind: typeof error };
}

/**
 * Report a failure from a named site.
 *
 * `where` is both a tag and part of the fingerprint, so two different failures
 * never collapse into one issue whose headline is whichever arrived last.
 */
export function report(
  where: string,
  error: unknown,
  detail?: Record<string, unknown>,
): void {
  const shape = describeError(error);

  Sentry.withScope((scope) => {
    scope.setTag("where", where);
    // Sentry titles an issue from the exception, so ten procedures failing on
    // the same network error produced ten issues with identical headlines and
    // a culprit of TRPCClientError#constructor. The transaction name is what
    // the issue list shows as the culprit, so put the site there.
    scope.setTransactionName(where);
    scope.setTag("error.kind", shape.kind);
    if (shape.code) scope.setTag("trpc.code", shape.code);
    if (shape.status !== undefined) {
      scope.setTag("http.status", String(shape.status));
    }
    if (detail) scope.setContext("detail", detail);
    scope.setFingerprint([
      where,
      shape.kind,
      shape.code ?? String(shape.status ?? ""),
    ]);

    // Capturing the exception keeps its stack. The fallback builds its message
    // from the reduced shape only, never from the value itself.
    Sentry.captureException(
      error instanceof Error ? error : new Error(`${where}: ${shape.kind}`),
    );
  });
}

/* -------------------------------------------------------------------------- */
/* PostHog                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every event carries an `app` property, registered below, including the
 * SDK's own `$screen` and `Application Opened`, and custom events are
 * prefixed `wt_`, so they stay identifiable in a PostHog project.
 */
export const posthog = POSTHOG_KEY
  ? new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      disabled: !ENABLED,
      enableSessionReplay: false,
    })
  : undefined;

posthog?.register({
  app: "wedgietracker",
  // PostHog otherwise resolves every event's IP to a city. That is location
  // data the App Privacy label does not declare and the app has no use for.
  $geoip_disable: true,
});

/**
 * Four events, deliberately. Screen views arrive as `$screen` already, so
 * anything listed here has to answer a question those cannot.
 */
export type TrackedEvent =
  | "wt_wedgie_opened"
  | "wt_video_source_switched"
  | "wt_filter_applied"
  | "wt_standings_tapped";

/** Analytics values are JSON on the wire, so the type says so. */
type TrackProperties = Record<string, string | number | boolean | null>;

export function track(event: TrackedEvent, properties?: TrackProperties): void {
  posthog?.capture(event, properties);
}

/* -------------------------------------------------------------------------- */
/* Screens                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * PostHog's screen autocapture does not support React Navigation 7, which is
 * what expo-router runs on, so screens are captured by hand. Trusting it gives
 * `$screen` events named after framework internals rather than routes.
 *
 * The same pathname also becomes a Sentry tag and breadcrumb, which is how a
 * crash report answers "what were they looking at" without tracing turned on.
 */
export function useScreenTracking(): void {
  const pathname = usePathname();

  useEffect(() => {
    const name = routeName(pathname);
    posthog?.screen(name);
    Sentry.setTag("screen", name);
    Sentry.addBreadcrumb({
      category: "navigation",
      message: name,
      level: "info",
    });
  }, [pathname]);
}

/** `/wedgie/482` groups as `/wedgie/[id]`, or every wedgie is its own screen. */
function routeName(pathname: string): string {
  const name = pathname.replace(/\/\d+(?=\/|$)/g, "/[id]");
  return name === "" ? "/" : name;
}
