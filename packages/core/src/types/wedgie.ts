import type { InferSelectModel } from "drizzle-orm";
import type { wedgie, type } from "../schema";

export type Wedgie = InferSelectModel<typeof wedgie>;
type Type = InferSelectModel<typeof type>;

export interface WedgieWithTypes extends Wedgie {
  types: Type[];
}

export interface VideoUrls {
  youtube?: string;
  youtubeShort?: string;
  /** Our own copy of the clip, on media.wedgietracker.com. */
  hosted?: string;
  youtubeNoDunks?: string;
  instagram?: string;
}
