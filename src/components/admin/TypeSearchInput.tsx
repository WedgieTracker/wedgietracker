"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Dialog } from "@radix-ui/react-dialog";

interface TypeSearchInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function TypeSearchInput({ value, onChange }: TypeSearchInputProps) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(value);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: types } = api.type.getAll.useQuery();
  const createTypeMutation = api.type.create.useMutation();

  useEffect(() => {
    setSelectedTypes(value);
  }, [value]);

  const filteredTypes =
    types?.filter((type) =>
      type.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleAddNewType = async () => {
    try {
      const result = await createTypeMutation.mutateAsync({ name: search });
      const newTypes = [...selectedTypes, result.name];
      setSelectedTypes(newTypes);
      onChange(newTypes);
      setIsAddingNew(false);
      setShowDropdown(false);
      setSearch("");
    } catch (error) {
      console.error("Failed to create type:", error);
    }
  };

  const handleTypeSelect = (typeName: string) => {
    if (!selectedTypes.includes(typeName)) {
      const newTypes = [...selectedTypes, typeName];
      setSelectedTypes(newTypes);
      onChange(newTypes);
    }
    setSearch("");
    setShowDropdown(false);
  };

  const handleTypeRemove = (typeName: string) => {
    const newTypes = selectedTypes.filter((t) => t !== typeName);
    setSelectedTypes(newTypes);
    onChange(newTypes);
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
          className="mt-1 block w-full rounded-md border-gray-300 bg-white/5 p-2 text-white"
        />

        {showDropdown && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-700 bg-darkpurple shadow-lg">
            {filteredTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                className="block w-full px-4 py-2 text-left text-white hover:bg-white/10"
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
                  className="block w-full px-4 py-2 text-left text-blue-400 hover:bg-white/10"
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
        {selectedTypes.map((type) => (
          <div
            key={type}
            className="flex items-center rounded bg-yellow px-2 py-1 text-sm text-darkpurple"
          >
            <span>{type}</span>
            <button
              onClick={() => handleTypeRemove(type)}
              className="ml-2 text-darkpurple hover:text-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {isAddingNew && (
        <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-darkpurple p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Add New Type</h2>
            <p className="mb-4 text-white">
              Are you sure you want to add &quot;{search}&quot; as a new type?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-4 py-2 text-white hover:text-gray-300"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAddingNew(false);
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
                  void handleAddNewType();
                }}
              >
                Add Type
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
