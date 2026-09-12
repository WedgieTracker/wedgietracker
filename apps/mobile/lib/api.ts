import Constants from "expo-constants";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@wedgietracker/web/api";

/**
 * `AppRouter` is a type-only import, so none of the web app's server code is
 * bundled here - only its shape, which keeps the client honest at compile time.
 */
export const api = createTRPCReact<AppRouter>();

/** Inferred shapes of every procedure, so screens never restate the API. */
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Where the tRPC endpoint lives. Override with EXPO_PUBLIC_API_URL when
 * pointing a simulator at a local `pnpm dev` (use your LAN IP, not localhost,
 * if you are on a physical device).
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const fromConfig = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromConfig) return fromConfig.replace(/\/$/, "");

  return "https://www.wedgietracker.com";
}

export function getTrpcUrl(): string {
  return `${getApiBaseUrl()}/api/trpc`;
}
