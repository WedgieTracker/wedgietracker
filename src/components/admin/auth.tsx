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
      className="rounded-lg border-2 border-solid border-yellow bg-yellow px-4 py-2 font-semibold text-darkpurple transition-colors hover:bg-darkpurple hover:text-yellow"
      onClick={() => signOut()}
    >
      Sign out
    </Button>
  );
}
