import { api } from "~/trpc/server";

export async function AdminDash() {
  const global = await api.admin.getGlobal();
  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-panel rounded-lg p-6 shadow-xs">
          <h3 className="text-cream/80 text-lg font-semibold">Total Wedgies</h3>
          <p className="text-violet mt-2 text-3xl font-bold">
            {global?.currentTotalWedgies}
          </p>
        </div>

        <div className="bg-panel rounded-lg p-6 shadow-xs">
          <h3 className="text-cream/80 text-lg font-semibold">Total Games</h3>
          <p className="text-cream mt-2 text-3xl font-bold">
            {global?.currentTotalGames}
          </p>
        </div>

        <div className="bg-panel rounded-lg p-6 shadow-xs">
          <h3 className="text-cream/80 text-lg font-semibold">Total Minutes</h3>
          <p className="text-cream mt-2 text-3xl font-bold">
            {global?.currentTotalMinutes}
          </p>
        </div>

        <div className="bg-panel rounded-lg p-6 shadow-xs">
          <h3 className="text-cream/80 text-lg font-semibold">
            Total Possessions
          </h3>
          <p className="text-cream mt-2 text-3xl font-bold">
            {global?.currentTotalPoss}
          </p>
        </div>

        <div className="bg-panel rounded-lg p-6 shadow-xs">
          <h3 className="text-cream/80 text-lg font-semibold">
            Total Field Goals
          </h3>
          <p className="text-cream mt-2 text-3xl font-bold">
            {global?.currentTotalFGA}
          </p>
        </div>
      </div>
    </div>
  );
}
