import { getCoffeeBoard, type BoardRow } from "~/server/coffee-board";
import { CoffeeCup } from "./CoffeeCup";

/** Shared places for ties: 5, 3, 3, 1 rank 1, 2, 2, 4. */
function ranked(rows: BoardRow[]) {
  return rows.map((row) => ({
    ...row,
    rank: rows.findIndex((r) => r.coffees === row.coffees) + 1,
  }));
}

function Name({ name }: { name: string | null }) {
  return name ? (
    <span className="text-cream block truncate">{name}</span>
  ) : (
    <span className="text-cream/55 block truncate italic">Anonymous</span>
  );
}

function Cups({ n }: { n: number }) {
  const shown = Math.min(n, 3);
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => (
        <CoffeeCup key={i} className="size-4 sm:size-6" full steam={false} />
      ))}
      {n > shown && (
        <span className="text-cream/60 ml-1 text-xs font-black">
          +{n - shown}
        </span>
      )}
    </span>
  );
}

/** By rank: first tallest, then second, then third; a tie shares a height. */
const HEIGHTS = ["h-28", "h-20", "h-14"];

/**
 * This season's coffee leaderboard: the top three on a podium, the rest
 * listed under it. Empty places invite the next buyers.
 */
export async function CoffeeLeaderboard() {
  const { season, rows } = await getCoffeeBoard();
  const all = ranked(rows);
  const top = [0, 1, 2].map((i) => all[i] ?? null);
  // Second, first, third, as podiums stand.
  const order = [1, 0, 2];

  return (
    <section aria-labelledby="coffee-board" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="coffee-board"
          className="text-cream text-2xl font-black tracking-[-0.02em]"
        >
          Coffee leaderboard
        </h2>
        {season && (
          <span className="text-cream/50 text-xs font-bold">{season}</span>
        )}
      </div>
      <div className="bg-panel border-violet/20 rounded-[20px] border px-4 py-2">
        <ol className="flex items-end justify-center gap-3 px-2 pt-4">
          {order.map((place) => {
            const r = top[place];
            return (
              <li
                key={place}
                className="flex w-[30%] min-w-0 flex-col items-center gap-2"
              >
                {r ? (
                  <>
                    <Cups n={r.coffees} />
                    <div className="w-full min-w-0 text-center text-[14px] font-extrabold">
                      <Name name={r.name} />
                    </div>
                    <div
                      className={`bg-badge grain flex w-full flex-col items-center justify-start rounded-t-xl pt-2 ${HEIGHTS[r.rank - 1] ?? HEIGHTS[2]}`}
                    >
                      <span className="text-cream font-numerals text-shadow-badge text-3xl">
                        {r.coffees}
                      </span>
                      <span className="sr-only">
                        {r.coffees === 1 ? "coffee" : "coffees"}, place {r.rank}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-cream/40 w-full text-center text-[13px] font-bold">
                      Your name here
                    </div>
                    <div
                      className={`border-cream/20 w-full rounded-t-xl border-2 border-b-0 border-dashed ${HEIGHTS[place]}`}
                    />
                  </>
                )}
              </li>
            );
          })}
        </ol>
        {all.length > 3 && (
          <ol className="divide-violet/15 mt-3 divide-y" start={4}>
            {all.slice(3).map((r, i) => (
              <li
                key={i}
                className="grid grid-cols-[2.25rem_1fr_2.5rem] items-center gap-3 py-2.5"
              >
                <span className="text-violet font-numerals text-right">
                  {r.rank}
                </span>
                <span className="min-w-0 text-[14px] font-extrabold">
                  <Name name={r.name} />
                </span>
                <span className="text-cream font-numerals text-right text-xl">
                  {r.coffees}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="text-cream/55 text-[13px] font-bold">
        Buy a coffee to get your name on the board, or stay anonymous.
      </p>
    </section>
  );
}
