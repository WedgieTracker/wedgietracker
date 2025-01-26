"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function UpdateYoutubeLinks() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  const mutation = api.wedgie.updateYoutubeLinks.useMutation({
    onSuccess: (data) => {
      setIsUpdating(false);
      setResult({ success: true, message: data.message });
    },
    onError: (error) => {
      setIsUpdating(false);
      setResult({ success: false, message: error.message });
    },
  });

  const handleUpdate = () => {
    setIsUpdating(true);
    setResult(null);
    mutation.mutate();
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleUpdate}
        disabled={isUpdating}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isUpdating ? "Updating YouTube Links..." : "Update YouTube Links"}
      </button>

      {result && (
        <div
          className={`mt-4 rounded p-3 ${result.success ? "bg-green-800/50" : "bg-red-800/50"}`}
        >
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}
