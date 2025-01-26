import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { SignIn } from "~/components/admin/auth";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/sidebar";
import { AdminHeader } from "~/components/admin/header";
import { SeasonGamesList } from "~/components/admin/SeasonGamesList";

export default async function Seasons() {
  const session = await auth();

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
              <SeasonGamesList />
            </div>
          </main>
        </SidebarProvider>
      )}
    </HydrateClient>
  );
}
