/**
 * Whether an email may use the admin. Exact matches against ADMIN_EMAILS only;
 * an unset list lets nobody in.
 *
 * Kept free of imports so the tRPC middleware and route handlers can use it
 * without pulling in the Auth.js adapter or env validation.
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
