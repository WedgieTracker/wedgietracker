import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import SuperJSON from "superjson";

import { api, getTrpcUrl } from "./api";
import { report } from "./observability";

/**
 * The server serialises with SuperJSON (see apps/web/src/trpc/react.tsx), so
 * the transformer has to match or dates come back as strings.
 *
 * We use httpBatchLink rather than the web app's httpBatchStreamLink: streaming
 * on React Native needs TextDecoderStream/ReadableStream polyfills, and nothing
 * in this app streams.
 */
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Every screen reads through tRPC, so one handler here is the whole
        // failure surface. It fires only once `retry` is exhausted, which
        // keeps a flaky connection from filing an issue.
        queryCache: new QueryCache({
          onError: (error, query) => {
            report(`trpc.${procedureOf(query.queryKey)}`, error);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 2,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: getTrpcUrl(),
          transformer: SuperJSON,
          headers: () => ({ "x-trpc-source": "expo-ios" }),
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}

/**
 * `["wedgie","getAll"], { ... }` becomes `wedgie.getAll`.
 *
 * The procedure alone, never the input: it names the failure precisely enough
 * to give each one its own Sentry issue, without carrying a payload along.
 */
function procedureOf(queryKey: readonly unknown[]): string {
  const path = queryKey[0];
  return Array.isArray(path) ? path.join(".") : "unknown";
}
