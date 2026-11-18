"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { AddNewEntityDialog } from "./AddNewEntityDialog";

interface TypeSearchInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function TypeSearchInput({ value, onChange }: TypeSearchInputProps) {
  const [search, setSearch] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: types } = api.type.getAll.useQuery();
  const createTypeMutation = api.type.create.useMutation();

  const filteredTypes =
    types?.filter((type) =>
      type.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleAddNewType = async () => {
    try {
      const result = await createTypeMutation.mutateAsync({ name: search });
      onChange([...value, result!.name]);
      setIsAddingNew(false);
      setShowDropdown(false);
      setSearch("");
    } catch (error) {
      console.error("Failed to create type:", error);
    }
  };

  const handleTypeSelect = (typeName: string) => {
    if (!value.includes(typeName)) {
      onChange([...value, typeName]);
    }
    setSearch("");
    setShowDropdown(false);
  };

  const handleTypeRemove = (typeName: string) => {
    onChange(value.filter((t) => t !== typeName));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search types..."
          className="border-violet/30 bg-panel text-cream mt-1 block w-full rounded-md p-2"
        />

        {showDropdown && (
          <div className="bg-night border-violet/30 absolute z-10 mt-1 w-full rounded-md border shadow-lg">
            {filteredTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                className="text-cream hover:bg-panel block w-full px-4 py-2 text-left"
                onClick={(e) => {
                  e.preventDefault();
                  handleTypeSelect(type.name);
                }}
              >
                {type.name}
              </button>
            ))}
            {search &&
              !filteredTypes.find(
                (t) => t.name.toLowerCase() === search.toLowerCase(),
              ) && (
                <button
                  type="button"
                  className="text-violet hover:bg-panel block w-full px-4 py-2 text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAddingNew(true);
                  }}
                >
                  Add new type: {search}
                </button>
              )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((type) => (
          <div
            key={type}
            className="bg-cream text-night flex items-center rounded px-2 py-1 text-sm"
          >
            <span>{type}</span>
            <button
              onClick={() => handleTypeRemove(type)}
              className="text-night hover:text-cream ml-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {isAddingNew && (
        <AddNewEntityDialog
          open={isAddingNew}
          onOpenChange={setIsAddingNew}
          entityLabel="Type"
          searchValue={search}
          onConfirm={() => void handleAddNewType()}
        />
      )}
    </div>
  );
}
