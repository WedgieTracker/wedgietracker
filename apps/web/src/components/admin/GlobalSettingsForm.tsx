"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export function GlobalSettingsForm() {
  const { data: global, refetch } = api.admin.getGlobal.useQuery();
  const updateMutation = api.admin.updateGlobal.useMutation({
    onSuccess: () => refetch(),
  });

  const [formData, setFormData] = useState({
    currentTotalWedgies: 0,
    currentTotalGames: 0,
    currentTotalMinutes: 0,
    currentTotalFGA: 0,
    currentTotalPoss: 0,
    pace: 0,
    simplePace: 0,
    mathPace: 0,
  });

  // Update form data when global data is fetched
  useEffect(() => {
    if (global) {
      setFormData({
        currentTotalWedgies: global.currentTotalWedgies,
        currentTotalGames: global.currentTotalGames,
        currentTotalMinutes: global.currentTotalMinutes,
        currentTotalFGA: global.currentTotalFGA,
        currentTotalPoss: global.currentTotalPoss,
        pace: global.pace,
        simplePace: global.simplePace,
        mathPace: global.mathPace,
      });
    }
  }, [global]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync(formData);
  };

  if (!global) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="totalWedgies"
            className="text-cream block text-sm font-medium"
          >
            Total Wedgies
          </label>
          <input
            id="totalWedgies"
            type="number"
            value={formData.currentTotalWedgies}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                currentTotalWedgies: parseInt(e.target.value),
              }))
            }
            className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
          />
        </div>

        <div>
          <label
            htmlFor="totalGames"
            className="text-cream block text-sm font-medium"
          >
            Total Games
          </label>
          <input
            id="totalGames"
            type="number"
            value={formData.currentTotalGames}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                currentTotalGames: parseInt(e.target.value),
              }))
            }
            className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
          />
        </div>

        <div>
          <label
            htmlFor="totalMinutes"
            className="text-cream block text-sm font-medium"
          >
            Total Minutes
          </label>
          <input
            id="totalMinutes"
            type="number"
            value={formData.currentTotalMinutes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                currentTotalMinutes: parseInt(e.target.value),
              }))
            }
            className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
          />
        </div>

        <div>
          <label
            htmlFor="totalFGA"
            className="text-cream block text-sm font-medium"
          >
            Total Field Goal Attempts
          </label>
          <input
            id="totalFGA"
            type="number"
            value={formData.currentTotalFGA}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                currentTotalFGA: parseInt(e.target.value),
              }))
            }
            className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
          />
        </div>

        <div>
          <label
            htmlFor="totalPoss"
            className="text-cream block text-sm font-medium"
          >
            Total Possessions
          </label>
          <input
            id="totalPoss"
            type="number"
            value={formData.currentTotalPoss}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                currentTotalPoss: parseInt(e.target.value),
              }))
            }
            className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
          />
        </div>

        <div>
          <label
            htmlFor="pace"
            className="text-cream block text-sm font-medium"
          >
            Pace
          </label>
          <input
            id="pace"
            type="number"
            value={formData.pace}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                pace: parseInt(e.target.value),
              }))
            }
            className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
          />
        </div>

        <div>
          <label
            htmlFor="simplePace"
            className="text-cream block text-sm font-medium"
          >
            Simple Pace
          </label>
          <input
            id="simplePace"
            type="number"
            value={formData.simplePace}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                simplePace: parseInt(e.target.value),
              }))
            }
            className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
          />
        </div>

        <div>
          <label
            htmlFor="mathPace"
            className="text-cream block text-sm font-medium"
          >
            Math Pace
          </label>
          <input
            id="mathPace"
            type="number"
            value={formData.mathPace}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                mathPace: parseInt(e.target.value),
              }))
            }
            className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-violet text-cream hover:bg-violet/80 rounded-md px-4 py-2"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
