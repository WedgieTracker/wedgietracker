"use client";

import { api } from "~/trpc/react";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#ff6fd8] text-night",
  approved: "bg-violet text-cream",
  rejected: "bg-cream/20 text-cream/70",
};

/**
 * Names buyers chose for the coffee leaderboard, pending ones first. Only an
 * approved name shows on the board; anything else shows as Anonymous.
 */
export function CoffeeNameList() {
  const { data: names, refetch } = api.donations.listBoardNames.useQuery();
  const setStatus = api.donations.setBoardNameStatus.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-cream text-xl font-bold">Coffee leaderboard names</h2>
      {names?.length === 0 && <p className="text-cream/60">No names yet.</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {names?.map((n) => (
          <div
            key={n.sessionId}
            className="bg-panel text-cream flex flex-col gap-3 rounded-lg p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-lg font-bold break-words">
                {n.displayName}
              </p>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase ${STATUS_STYLE[n.nameStatus ?? "pending"]}`}
              >
                {n.nameStatus ?? "pending"}
              </span>
            </div>
            <p suppressHydrationWarning className="text-cream/70 text-sm">
              {n.coffees} {n.coffees === 1 ? "coffee" : "coffees"} ·{" "}
              {n.seasonName} ·{" "}
              {n.sessionId.startsWith("appstore:") ? "App Store" : "Stripe"} ·{" "}
              {/* SQLite CURRENT_TIMESTAMP is UTC without a zone marker */}
              {new Date(`${n.createdAt.replace(" ", "T")}Z`).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={n.nameStatus === "approved" || setStatus.isPending}
                onClick={() =>
                  setStatus.mutate({
                    sessionId: n.sessionId,
                    status: "approved",
                  })
                }
                className="bg-violet text-cream rounded-md px-3 py-1.5 text-sm font-bold disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={n.nameStatus === "rejected" || setStatus.isPending}
                onClick={() =>
                  setStatus.mutate({
                    sessionId: n.sessionId,
                    status: "rejected",
                  })
                }
                className="border-cream/30 text-cream rounded-md border px-3 py-1.5 text-sm font-bold disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
