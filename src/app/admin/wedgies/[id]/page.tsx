import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { SignIn } from "~/components/admin/auth";
import { WedgieFormPage } from "~/components/admin/WedgieFormPage";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditWedgiePage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <SignIn />
        </div>
      </main>
    );
  }

  // If id is "new", we're creating a new wedgie
  if (id === "new") {
    const global = await api.admin.getGlobal();
    return (
      <main className="min-h-screen w-full bg-darkpurple p-6">
        <WedgieFormPage currentSeason={global?.currentSeason?.name} />
      </main>
    );
  }

  // Otherwise, fetch the existing wedgie
  const wedgie = await api.wedgie.getById({ id });
  if (!wedgie) {
    return notFound();
  }

  return (
    <main className="min-h-screen w-full bg-darkpurple p-6">
      <WedgieFormPage wedgie={wedgie} />
    </main>
  );
}
