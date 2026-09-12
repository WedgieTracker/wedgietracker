import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Account identifiers stay out of the public repo. They come from the
 * environment: EAS environment variables on build servers, and
 * ~/.private_keys/asc.env locally through scripts/asc-env.sh.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: config.plugins?.map((plugin) =>
    Array.isArray(plugin) && plugin[0] === "@sentry/react-native"
      ? [
          plugin[0],
          {
            ...plugin[1],
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
          },
        ]
      : plugin,
  ),
  extra: {
    ...config.extra,
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? process.env.EAS_BUILD_PROJECT_ID,
    },
  },
});
