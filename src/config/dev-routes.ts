export const isDev = process.env.NODE_ENV === "development";

// List of routes that should only be available in development
export const devOnlyRoutes = [
  "/admin/batch",
  "/admin/wedgie-game-linking",
  // Add other dev-only routes
];
