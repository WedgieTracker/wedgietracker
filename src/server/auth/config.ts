import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    } & DefaultSession["user"];
    error?: string;
  }

  interface User {
    id?: string | undefined;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }

  interface Account {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  }

  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}

// Add this interface for the refresh token response
interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Function to refresh access tokens
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = "https://oauth2.googleapis.com/token";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = (await response.json()) as RefreshTokenResponse;

    if (!response.ok) {
      throw new Error(JSON.stringify(refreshedTokens));
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
            "openid",
            "email",
            "profile",
          ].join(" "),
          access_type: "offline", // Requests a refresh token
          prompt: "consent", // Ensures refresh token is granted
        },
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * JWT Callback
     * This is called whenever a JSON Web Token is created (i.e., at sign in) or updated (i.e., via token refresh).
     */
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.accessToken = account.access_token ?? null;
        token.refreshToken = account.refresh_token ?? null;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : 0; // Convert to ms
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },

    /**
     * Session Callback
     * This is called whenever a session is checked.
     */
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.accessToken = token.accessToken as string;
      session.user.refreshToken = token.refreshToken as string;
      session.user.expiresAt = token.accessTokenExpires as number;

      if (typeof token.error === "string") {
        session.error = token.error;
      }

      return session;
    },

    /**
     * Sign In Callback (Optional)
     * Uncomment and customize if you want to restrict sign-in to certain users.
     */
    // async signIn({ user, account, profile, email, credentials }) {
    //   const allowedEmailPatterns = [
    //     "@wedgietracker.com",
    //     "@riccardoaltieri.com",
    //     "riccardoaltieri@me.com",
    //   ];

    //   const isAllowedEmail = allowedEmailPatterns.some(
    //     (pattern) => user.email?.endsWith(pattern) ?? false,
    //   );

    //   return isAllowedEmail;
    // },
  },
} satisfies NextAuthConfig;
