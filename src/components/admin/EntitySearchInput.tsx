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
        className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
        placeholder={`Search for a ${lowerLabel}...`}
      />

      {showDropdown && (
        <div className="bg-darkpurple absolute z-10 mt-1 w-full rounded-md border border-gray-700 shadow-lg">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="block w-full px-4 py-2 text-left text-white hover:bg-white/10"
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
                className="block w-full px-4 py-2 text-left text-blue-400 hover:bg-white/10"
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
