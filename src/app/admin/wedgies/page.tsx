import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SignIn } from "~/components/admin/auth";

import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/sidebar";
import { AdminHeader } from "~/components/admin/header";

import { WedgieList } from "~/components/admin/WedgieList";

export default async function Wedgies() {
  const session = await auth();
  const global = await api.admin.getGlobal();
  const seasons = await api.season.getAll();
  const currentSeason = global?.currentSeason.name ?? null;

  return (
    <HydrateClient>
      {!session ? (
        <main className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="text-center">
            <SignIn />
          </div>
        </main>
      ) : (
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <main className="min-h-screen w-full bg-darkpurple">
            <AdminHeader />
            <div className="container mx-auto p-6">
              <WedgieList seasons={seasons} currentSeason={currentSeason} />
            </div>
          </main>
        </SidebarProvider>
      )}
    </HydrateClient>
  );
}
