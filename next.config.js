/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    // Type checking is handled by tsc (TypeScript native) in the CI pipeline
    ignoreBuildErrors: true,
  },
  experimental: {
    // TypeScript 7 ships the native Go compiler, which has no JS compiler API
    // for Next.js to call into. Drive the tsc CLI instead.
    useTypeScriptCli: true,
  },
  cacheComponents: true,
};

export default config;
