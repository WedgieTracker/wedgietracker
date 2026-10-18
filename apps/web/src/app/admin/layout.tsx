import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "~/server/auth";
import { isAllowedEmail } from "~/server/auth/allowlist";
import { HydrateClient } from "~/trpc/server";
import { SignIn, SignOut } from "~/components/admin/auth";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/sidebar";
import { AdminHeader } from "~/components/admin/header";

async function AuthenticatedAdmin({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <SignIn />
        </div>
      </main>
    );
  }

  if (!isAllowedEmail(session.user.email)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="space-y-4 text-center">
          <p>This account doesn&apos;t have admin access.</p>
          <SignOut />
        </div>
      </main>
    );
  }

  return (
    <HydrateClient>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <main className="bg-darkpurple min-h-screen w-full">
          <AdminHeader />
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </SidebarProvider>
    </HydrateClient>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="bg-darkpurple flex min-h-screen items-center justify-center">
          <div className="text-white">Loading...</div>
        </main>
      }
    >
      <AuthenticatedAdmin>{children}</AuthenticatedAdmin>
    </Suspense>
  );
}
