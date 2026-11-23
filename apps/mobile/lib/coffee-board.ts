import { File, Paths } from "expo-file-system";

/** The longest name the leaderboard takes, as on the website and Stripe. */
export const BOARD_NAME_MAX = 24;

/**
 * What this install remembers for the coffee leaderboard: a random id, so
 * its coffees share one place on the board, and the last name chosen, to
 * fill in the field next time. The id is made here and only ever sent to
 * WedgieTracker, which stores a one-way hash of it, never the id itself.
 */
type Saved = { installId: string; name?: string };

const file = () => new File(Paths.document, "coffee-board.json");

function uuid(): string {
  const bytes = new Uint8Array(16);
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let cached: Saved | null = null;

async function read(): Promise<Saved> {
  if (cached) return cached;
  try {
    const f = file();
    if (f.exists) {
      const parsed = JSON.parse(await f.text()) as Partial<Saved>;
      if (typeof parsed.installId === "string") {
        cached = {
          installId: parsed.installId,
          name: typeof parsed.name === "string" ? parsed.name : undefined,
        };
        return cached;
      }
    }
  } catch {
    // Unreadable: start again with a new id.
  }
  cached = { installId: uuid() };
  write(cached);
  return cached;
}

function write(saved: Saved) {
  try {
    const f = file();
    if (!f.exists) f.create();
    f.write(JSON.stringify(saved));
  } catch {
    // Not saved: the next purchase only gets a place of its own.
  }
}

/** This install's id for the leaderboard, made on first use. */
export async function getInstallId(): Promise<string> {
  return (await read()).installId;
}

/** The name last put on the board from this install, for the field. */
export async function getSavedBoardName(): Promise<string> {
  return (await read()).name ?? "";
}

export async function rememberBoardName(name: string) {
  const saved = { ...(await read()), name: name.trim() };
  cached = saved;
  write(saved);
}
