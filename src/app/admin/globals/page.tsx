import { auth } from "~/server/auth";
import { SignIn } from "~/components/admin/auth";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/sidebar";
import { AdminHeader } from "~/components/admin/header";
import { GlobalSettingsForm } from "~/components/admin/GlobalSettingsForm";

export default async function GlobalSettingsPage() {
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

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <main className="min-h-screen w-full bg-darkpurple">
        <AdminHeader />
        <div className="container mx-auto p-6">
          <h2 className="mb-6 text-2xl font-bold text-white">
            Global Settings
          </h2>
          <GlobalSettingsForm />
        </div>
      </main>
    </SidebarProvider>
  );
}
