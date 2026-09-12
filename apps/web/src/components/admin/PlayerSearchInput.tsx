"use client";

import { api } from "~/trpc/react";
import { EntitySearchInput } from "./EntitySearchInput";

interface PlayerSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PlayerSearchInput({ value, onChange }: PlayerSearchInputProps) {
  const { data: players } = api.player.getAll.useQuery();
  const createMutation = api.player.create.useMutation();

  return (
    <EntitySearchInput
      value={value}
      onChange={onChange}
      entityLabel="Player"
      items={players}
      onCreate={async (name) => {
        const result = await createMutation.mutateAsync({ name });
        return { name: result!.name };
      }}
    />
  );
}
