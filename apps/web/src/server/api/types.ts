/**
 * Type-only entry point for API clients (e.g. apps/mobile).
 *
 * Re-exports nothing but types, so importing this from another package can
 * never pull Next.js server code into that package's bundle.
 */
export type { AppRouter } from "./root";
