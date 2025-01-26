import { api } from "~/trpc/server";

export async function AdminDash() {
  const global = await api.admin.getGlobal();
  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">Total Wedgies</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {global?.currentTotalWedgies}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">Total Games</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {global?.currentTotalGames}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">Total Minutes</h3>
          <p className="mt-2 text-3xl font-bold text-purple-600">
            {global?.currentTotalMinutes}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">
            Total Possessions
          </h3>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {global?.currentTotalPoss}
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">
            Total Field Goals
          </h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {global?.currentTotalFGA}
          </p>
        </div>
      </div>
    </div>
  );
}
