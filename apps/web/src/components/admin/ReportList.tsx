"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export function ReportList() {
  const [showResolved, setShowResolved] = useState(false);

  const { data: reports, refetch } = api.report.list.useQuery({
    resolved: showResolved,
  });

  const setResolved = api.report.setResolved.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold text-white">Reports</h2>
        <select
          value={showResolved ? "resolved" : "open"}
          onChange={(e) => setShowResolved(e.target.value === "resolved")}
          className="rounded-md bg-white/10 px-3 py-2 text-white"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {reports?.length === 0 && (
        <p className="text-white/60">
          No {showResolved ? "resolved" : "open"} reports.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports?.map((report) => (
          <div
            key={report.id}
            className="rounded-lg bg-white/10 p-6 text-white shadow-xs"
          >
            <h3 className="text-lg font-semibold">
              #{report.wedgie.number} - {report.wedgie.playerName}
            </h3>
            <p suppressHydrationWarning className="mt-1 text-sm text-gray-300">
              {report.wedgie.seasonName} | {report.wedgie.teamName} -{" "}
              {report.wedgie.teamAgainstName} |{" "}
              {/* SQLite CURRENT_TIMESTAMP is UTC without a zone marker */}
              {new Date(
                `${report.createdAt.replace(" ", "T")}Z`,
              ).toLocaleString()}
            </p>
            <p className="mt-3">
              <span className="bg-pink rounded px-2 py-0.5 text-xs font-bold uppercase">
                {report.field}
              </span>
            </p>
            {report.note && (
              <p className="mt-2 text-sm whitespace-pre-wrap">{report.note}</p>
            )}
            <div className="mt-3 flex space-x-4">
              <Link
                href={`/admin/wedgies/${report.wedgie.id}`}
                className="bg-yellow hover:bg-yellow/80 rounded-md px-4 py-1 font-bold text-black uppercase"
              >
                Edit wedgie
              </Link>
              <button
                onClick={() =>
                  setResolved.mutate({
                    id: report.id,
                    resolved: !report.resolved,
                  })
                }
                className="rounded-md bg-white/20 px-4 py-1 font-bold text-white uppercase hover:bg-white/30"
              >
                {report.resolved ? "Reopen" : "Resolve"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
