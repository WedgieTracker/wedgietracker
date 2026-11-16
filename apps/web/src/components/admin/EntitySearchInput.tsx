"use client";

import { useState } from "react";
import { AddNewEntityDialog } from "./AddNewEntityDialog";

interface EntitySearchInputProps {
  value: string;
  onChange: (value: string) => void;
  entityLabel: string;
  items: Array<{ id: string | number; name: string }> | undefined;
  onCreate: (name: string) => Promise<{ name: string }>;
}

export function EntitySearchInput({
  value,
  onChange,
  entityLabel,
  items,
  onCreate,
}: EntitySearchInputProps) {
  const [search, setSearch] = useState(value);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const lowerLabel = entityLabel.toLowerCase();
  const filteredItems =
    items?.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleAddNew = async () => {
    try {
      const result = await onCreate(search);
      onChange(result.name);
      setIsAddingNew(false);
      setShowDropdown(false);
    } catch (error) {
      console.error(`Failed to create ${lowerLabel}:`, error);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
        placeholder={`Search for a ${lowerLabel}...`}
      />

      {showDropdown && (
        <div className="bg-night border-violet/30 absolute z-10 mt-1 w-full rounded-md border shadow-lg">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="text-cream hover:bg-panel block w-full px-4 py-2 text-left"
              onClick={(e) => {
                e.preventDefault();
                onChange(item.name);
                setSearch(item.name);
                setShowDropdown(false);
              }}
            >
              {item.name}
            </button>
          ))}
          {search &&
            !filteredItems.find(
              (i) => i.name.toLowerCase() === search.toLowerCase(),
            ) && (
              <button
                type="button"
                className="text-violet hover:bg-panel block w-full px-4 py-2 text-left"
                onClick={(e) => {
                  e.preventDefault();
                  setIsAddingNew(true);
                }}
              >
                Add new {lowerLabel}: {search}
              </button>
            )}
        </div>
      )}

      {isAddingNew && (
        <AddNewEntityDialog
          open={isAddingNew}
          onOpenChange={setIsAddingNew}
          entityLabel={entityLabel}
          searchValue={search}
          onConfirm={() => void handleAddNew()}
        />
      )}
    </div>
  );
}
