import { api } from "~/trpc/server";
import { WedgieList } from "~/components/admin/WedgieList";

export default async function Wedgies() {
  const [global, seasons] = await Promise.all([
    api.admin.getGlobal(),
    api.season.getAll(),
  ]);
  const currentSeason = global?.currentSeason.name ?? null;

  return <WedgieList seasons={seasons} currentSeason={currentSeason} />;
}
