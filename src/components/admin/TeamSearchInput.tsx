"use client";

import { api } from "~/trpc/react";
import { EntitySearchInput } from "./EntitySearchInput";

interface TeamSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TeamSearchInput({ value, onChange }: TeamSearchInputProps) {
  const { data: teams } = api.team.getAll.useQuery();
  const createMutation = api.team.create.useMutation();

  return (
    <EntitySearchInput
      value={value}
      onChange={onChange}
      entityLabel="Team"
      items={teams}
      onCreate={async (name) => {
        const result = await createMutation.mutateAsync({ name });
        return { name: result!.name };
      }}
    />
  );
}
