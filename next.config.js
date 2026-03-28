/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    // Type checking is handled by tsgo (TypeScript native) in the CI pipeline
    ignoreBuildErrors: true,
  },
  cacheComponents: true,
};

export default config;
