"use client";

import { signIn, signOut } from "next-auth/react";

import { Button } from "~/components/ui/button";

export function SignIn() {
  return (
    <Button onClick={() => signIn("google", { callbackUrl: "/admin" })}>
      Sign in with Google
    </Button>
  );
}

export function SignOut() {
  return (
    <Button
      className="border-yellow bg-yellow text-darkpurple hover:bg-darkpurple hover:text-yellow rounded-lg border-2 border-solid px-4 py-2 font-semibold transition-colors"
      onClick={() => signOut()}
    >
      Sign out
    </Button>
  );
}
