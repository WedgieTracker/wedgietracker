import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SignIn } from "~/components/admin/auth";

import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/sidebar";
import { AdminHeader } from "~/components/admin/header";
import { AdminDash } from "~/components/admin/dash";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Admin",
  description: "Admin dashboard",
});

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.admin.getGlobal.prefetch();
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <SignIn />
        </div>
      </main>
    );
  }

  return (
    <HydrateClient>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <main className="min-h-screen w-full bg-darkpurple">
          <AdminHeader />

          <AdminDash />
        </main>
      </SidebarProvider>
    </HydrateClient>
  );
}
