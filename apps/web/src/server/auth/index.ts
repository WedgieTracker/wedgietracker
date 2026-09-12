import NextAuth, { type Session } from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers } = NextAuth(authConfig);

/**
 * Annotated rather than inferred: NextAuth's inferred type pulls in
 * middleware/route-handler overloads that cannot be named in declaration
 * output. Every call site calls `auth()` bare, so this is the used surface.
 */
const auth: () => Promise<Session | null> = cache(uncachedAuth);

export { auth, handlers };
