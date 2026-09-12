import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import SuperJSON from "superjson";

import { api, getTrpcUrl } from "./api";

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
