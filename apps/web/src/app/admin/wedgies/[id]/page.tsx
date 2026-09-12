import { api } from "~/trpc/server";
import { WedgieFormPage } from "~/components/admin/WedgieFormPage";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditWedgiePage({ params }: PageProps) {
  const { id } = await params;

  // If id is "new", we're creating a new wedgie
  if (id === "new") {
    const global = await api.admin.getGlobal();
    return <WedgieFormPage currentSeason={global?.currentSeason?.name} />;
  }

  // Otherwise, fetch the existing wedgie
  const wedgie = await api.wedgie.getById({ id });
  if (!wedgie) {
    return notFound();
  }

  return <WedgieFormPage wedgie={wedgie} />;
}
