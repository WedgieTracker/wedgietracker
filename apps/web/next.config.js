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
  // @wedgietracker/core ships raw TypeScript from the workspace
  transpilePackages: ["@wedgietracker/core"],
  async redirects() {
    return [
      // A short link to the iOS app for posts and bios. Kept temporary so it can
      // point elsewhere later. Same URL as APP_STORE_URL in AppStoreBadge.tsx.
      {
        source: "/app",
        destination: "https://apps.apple.com/app/wedgietracker/id6811376841",
        permanent: false,
      },
    ];
  },
};

export default config;
