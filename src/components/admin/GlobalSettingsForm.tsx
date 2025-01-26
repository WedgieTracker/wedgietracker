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
          <label className="block text-sm font-medium text-white">
            Total Wedgies
          </label>
          <input
            type="number"
            value={formData.currentTotalWedgies}
            onChange={(e) =>
              setFormData({
                ...formData,
                currentTotalWedgies: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Total Games
          </label>
          <input
            type="number"
            value={formData.currentTotalGames}
            onChange={(e) =>
              setFormData({
                ...formData,
                currentTotalGames: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Total Minutes
          </label>
          <input
            type="number"
            value={formData.currentTotalMinutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                currentTotalMinutes: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Total Field Goal Attempts
          </label>
          <input
            type="number"
            value={formData.currentTotalFGA}
            onChange={(e) =>
              setFormData({
                ...formData,
                currentTotalFGA: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Total Possessions
          </label>
          <input
            type="number"
            value={formData.currentTotalPoss}
            onChange={(e) =>
              setFormData({
                ...formData,
                currentTotalPoss: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white">Pace</label>
          <input
            type="number"
            value={formData.pace}
            onChange={(e) =>
              setFormData({
                ...formData,
                pace: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Simple Pace
          </label>
          <input
            type="number"
            value={formData.simplePace}
            onChange={(e) =>
              setFormData({
                ...formData,
                simplePace: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white">
            Math Pace
          </label>
          <input
            type="number"
            value={formData.mathPace}
            onChange={(e) =>
              setFormData({
                ...formData,
                mathPace: parseInt(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
