import type { InferSelectModel } from "drizzle-orm";
import type { wedgie, type } from "~/server/schema";

export type Wedgie = InferSelectModel<typeof wedgie>;
export type Type = InferSelectModel<typeof type>;

export interface WedgieWithTypes extends Wedgie {
  types: Type[];
}

export interface VideoUrls {
  youtube?: string;
  youtubeShort?: string;
  cloudinary?: string;
  youtubeNoDunks?: string;
  instagram?: string;
  selfHosted?: string;
}
