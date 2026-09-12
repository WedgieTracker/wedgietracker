<p align="center">
  <picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/github-logo-dark.svg">
  <img src="apps/web/public/github-logo-light.svg" width="200" alt="Logo for WedgieTracker">
</picture>
</p>

A modern application for tracking basketball wedgies, on the web and on iOS.

## Tech Stack

- [Next.js](https://nextjs.org) 16 - React 19 framework
- [Auth.js](https://authjs.dev/) 5 - Authentication
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [Turso](https://turso.tech) - SQLite database
- [Tailwind CSS](https://tailwindcss.com) 4 - Styling
- [tRPC](https://trpc.io) 11 - Type-safe API
- [TypeScript](https://www.typescriptlang.org/) 6 - Type safety
- [tsgo](https://github.com/nicolo-ribaudo/tc39-proposal-structs) (TypeScript native) - Fast type checking
- [oxlint](https://oxc.rs) - Fast linting (Rust-based)
- [Vitest](https://vitest.dev) - Testing
- [Expo](https://expo.dev) 57 / React Native - iOS app
- [Vercel](https://vercel.com) - Deployment

## Features

- Real-time wedgie tracking and statistics
- Authentication with Google
- Instagram, Twitter, Bluesky, and YouTube integration for sharing wedgies
- Cloudinary media management
- Newsletter subscription with Mailchimp
- Stripe integration for store purchases
- Printful integration for t-shirt orders
- Responsive design with custom animations
- Admin dashboard for managing wedgies

## Project Structure

A pnpm workspace. The web app and the iOS app share domain logic through
`packages/core`, and the iOS app types its API client against the web app's
tRPC router, so the two cannot drift apart silently.

```
apps/
├── web/                    # Next.js 16 app (the site, the API, the admin)
│   ├── src/app/            # App Router pages + API routes
│   ├── src/components/     # admin, home, layout, shared, standings, ui
│   ├── src/server/
│   │   ├── api/            # tRPC routers; types.ts is the client-facing type
│   │   ├── auth/           # Auth.js configuration
│   │   └── services/       # Stripe, Cloudinary, Printful, email, ...
│   └── src/config|context|hooks|lib|trpc/
└── mobile/                 # Expo app (iOS)
    ├── app/                # expo-router routes
    │   ├── (tabs)/         # Feed, Standings, Seasons, Stats
    │   └── wedgie/[id]     # Wedgie detail + video player
    ├── components/         # WedgieCard, WedgiePlayer, StatTile, Screen
    └── lib/                # tRPC client, provider, theme

packages/
└── core/                   # Shared, client-agnostic code
    ├── src/schema.ts       # Drizzle schema (single source of truth)
    ├── src/types/          # Domain types derived from the schema
    └── src/utils/          # Pure helpers (pace, filters, team aliases, video)
```

### How the iOS app talks to the API

The mobile app calls the same public tRPC procedures the website uses - there
is no second backend. It imports `AppRouter` as a **type only**, from
declarations that `apps/web` emits:

```bash
pnpm --filter @wedgietracker/web types:build
```

That runs automatically as part of `pnpm typecheck`. Because the import is
type-only, none of the server's dependencies (Next.js, Drizzle, Stripe,
Auth.js) reach the app bundle - only the shape of the API does.

Point the app at a different backend with `EXPO_PUBLIC_API_URL`; it otherwise
uses the production site.

## Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/wedgietracker/wedgietracker.git
cd wedgietracker
```

2. Install dependencies:

```bash
pnpm install
```

3. Create `apps/web/.env` from the example and add your environment variables:

```bash
cp apps/web/.env.example apps/web/.env
```

4. Set up the database. Two paths depending on access:

   **Without Turso access** (recommended for new contributors). Bootstrap a local SQLite copy from the committed seed:

   ```bash
   apps/web/sh/start-database.sh
   ```

   Then point `apps/web/.env` at the local file:

   ```
   TURSO_DATABASE_URL="file:./local.db"
   TURSO_AUTH_TOKEN=""
   ```

   **With Turso access**. Push the schema to your Turso database:

   ```bash
   pnpm db:push
   ```

5. Start the development server:

```bash
pnpm dev
```

6. Optionally, run the iOS app against production data (needs Xcode and the
   iOS Simulator):

```bash
pnpm mobile:ios
```

To run it against your local `pnpm dev` instead, set
`EXPO_PUBLIC_API_URL` in `apps/mobile/.env.local`. Use your machine's LAN
IP rather than `localhost` if you are testing on a physical device.

## Available Scripts

| Script               | Description                           |
| -------------------- | ------------------------------------- |
| `pnpm dev`           | Start dev server with Turbo and HTTPS |
| `pnpm build`         | Production build                      |
| `pnpm start`         | Start production server               |
| `pnpm lint`          | Run oxlint                            |
| `pnpm lint:fix`      | Run oxlint with auto-fix              |
| `pnpm typecheck`     | Run type checking with tsgo (native)  |
| `pnpm format:check`  | Check Prettier formatting             |
| `pnpm format:write`  | Fix Prettier formatting               |
| `pnpm test`          | Run tests once                        |
| `pnpm test:watch`    | Run tests in watch mode               |
| `pnpm test:coverage` | Run tests with coverage               |
| `pnpm check`         | Run oxlint + tsgo + tests             |
| `pnpm db:push`       | Push schema changes to database       |
| `pnpm db:generate`   | Generate database migrations          |
| `pnpm db:studio`     | Open Drizzle Studio                   |
| `pnpm db:dump`       | Refresh `database-backups/seed.sql`   |
| `pnpm mobile`        | Start the Expo dev server             |
| `pnpm mobile:ios`    | Open the iOS app in the Simulator     |

Scripts at the root delegate to the workspace packages. To target one package
directly, use `pnpm --filter @wedgietracker/web <script>` (or `.../core`,
`.../mobile`).

## Development Workflow

### Pre-commit Hooks

This project uses [lefthook](https://lefthook.dev) to enforce code quality on every commit:

- **TypeScript/TSX files**: oxlint auto-fix + Prettier formatting
- **JS/JSON/MD/CSS files**: Prettier formatting

### Dependency Management

Dependencies are kept up to date with [Dependabot](https://docs.github.com/en/code-security/dependabot), configured to open weekly PRs grouping minor and patch updates together.

### Testing

Tests are written with [Vitest](https://vitest.dev) and [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/).

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test:coverage # With coverage report
```

Test files use the `*.test.ts` / `*.test.tsx` convention and live alongside the code they test.

### CI/CD

**PR Checks** (opt-in): Add the `run-ci` label to a PR to trigger the CI workflow, which runs type checking, linting, format checking, and tests. You can also use these PR comment commands:

| Command    | Description                                         |
| ---------- | --------------------------------------------------- |
| `/ci`      | Add the `run-ci` label to trigger the CI workflow   |
| `/preview` | Push the PR branch to the deploy repo for a preview |

Both commands are restricted to repo owners, members, and collaborators.

**Auto-labeling**: PRs are automatically labeled based on changed files (e.g. `ci`, `docs`, `tests`, `admin`, `api`, `components`, `server`, `config`, `dependencies`).

**Releases**: Automatic semantic versioning on push to `main` based on commit message prefixes (`feat:` for minor, `BREAKING` for major, otherwise patch).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue. See our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

Created by [riccardo.lol](https://www.riccardo.lol)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
