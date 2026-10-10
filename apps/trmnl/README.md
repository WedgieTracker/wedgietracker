# WedgieTracker for TRMNL

A [TRMNL](https://trmnl.com) plugin that shows the current NBA season's wedgie count on an e-ink
display: the season total in the wave tank, the record status, the latest three wedgies, pace,
days without wedgies and the all-time total. It mirrors the website home page.

## Files

- `src/full.liquid`, `half_horizontal.liquid`, `half_vertical.liquid`, `quadrant.liquid`: markup,
  one per TRMNL view size.
- `src/shared.liquid`: `markup_shared` on TRMNL. Inlines the black wordmark from
  `apps/web/public/github-logo-light.svg` as `wt_logo` for the title bar.
- `src/transform.js`: flattens the five API responses into the variables the markup uses.
- `src/settings.yml`: polling URLs, refresh interval and the recipe's author bio.
- `previews/`: renders at TRMNL X (`v2`) resolution; `previews/og/` holds TRMNL OG (800x480) renders.

The markup is sized for the OG by default, with `lg:` classes for the larger TRMNL X. Preview
both (`og_plus` and `v2`) after any change.

## Data

The plugin polls five public, input-free tRPC queries on www.wedgietracker.com with no key:
`wedgie.getStats`, `wedgie.getTopStandings`, `admin.getGlobal`, `wedgie.getLatestWedgies` and
`wedgie.getTotalWedgies`. TRMNL passes their responses to the transform as `IDX_0` to `IDX_4`,
in the order of the polling URLs. Vercel's CDN serves these queries (see
`apps/web/src/server/api/cdn-cache.ts`), so polling devices don't invoke the function.

The plugin depends on the response shape of those procedures in
`apps/web/src/server/api/routers/{wedgie,admin}.ts`. `pnpm test` runs the transform against real
responses saved in `test/fixtures/`. If you change those procedures, refresh the fixtures with
the new shape and the test will tell you whether the plugin still gets what it needs:

```sh
for e in wedgie.getStats wedgie.getTopStandings admin.getGlobal wedgie.getLatestWedgies wedgie.getTotalWedgies; do
  curl -s "https://www.wedgietracker.com/api/trpc/$e" > "test/fixtures/$e.json"
done
```

## Deploying

The live plugin is private plugin setting `501111` ("WedgieTracker") on the TRMNL account.
Editing these files does not update TRMNL: paste the changed markup into the plugin's markup
editor on trmnl.com, or write it with TRMNL's MCP server (`writeMarkup`), then check a preview.
