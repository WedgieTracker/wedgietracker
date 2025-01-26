import type { Wedgie, Type } from "@prisma/client";

export interface WedgieWithTypes extends Wedgie {
  types: Type[];
}
