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
      <div className="bg-night fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg p-6">
        <h2 className="text-cream mb-4 text-lg font-bold">
          Add New {entityLabel}
        </h2>
        <p className="text-cream mb-4">
          Are you sure you want to add &quot;{searchValue}&quot; as a new{" "}
          {entityLabel.toLowerCase()}?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="text-cream hover:text-cream/70 px-4 py-2"
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
            className="bg-violet text-cream hover:bg-violet/80 rounded-md px-4 py-2"
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
