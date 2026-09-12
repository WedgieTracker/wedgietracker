"use client";

import { Dialog } from "@radix-ui/react-dialog";

interface AddNewEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  searchValue: string;
  onConfirm: () => void;
}

export function AddNewEntityDialog({
  open,
  onOpenChange,
  entityLabel,
  searchValue,
  onConfirm,
}: AddNewEntityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 bg-black/50" />
      <div className="bg-darkpurple fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg p-6">
        <h2 className="mb-4 text-lg font-bold text-white">
          Add New {entityLabel}
        </h2>
        <p className="mb-4 text-white">
          Are you sure you want to add &quot;{searchValue}&quot; as a new{" "}
          {entityLabel.toLowerCase()}?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 text-white hover:text-gray-300"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConfirm();
            }}
          >
            Add {entityLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
