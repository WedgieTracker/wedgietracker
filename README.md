<p align="center">
  <picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/github-logo-dark.svg">
  <img src="public/github-logo-light.svg" width="200" alt="Logo for WedgieTracker">
</picture>
</p>

A modern web application for tracking basketball wedgies.

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Auth.js](https://authjs.dev/) - Authentication
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [Turso](https://turso.tech) - SQLite database
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [tRPC](https://trpc.io) - Type-safe API
- [Vitest](https://vitest.dev) - Testing
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

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # API routes (stripe, social media, etc.)
│   ├── blog/               # Blog pages
│   ├── store/              # Store pages
│   └── ...                 # Public pages (standings, all-wedgies, etc.)
├── components/
│   ├── admin/              # Admin-specific components
│   ├── home/               # Homepage components (Stats, Wave, WedgieList)
│   ├── layout/             # Layout components (Header, Footer, PageLayout)
│   ├── shared/             # Shared reusable components (Loader, Cta, etc.)
│   ├── standings/          # Standings page components
│   └── ui/                 # shadcn/ui components
├── config/                 # App configuration (metadata, dev routes)
├── context/                # React context providers
├── hooks/                  # Custom React hooks
├── server/
│   ├── api/                # tRPC routers and configuration
│   ├── auth/               # Auth.js configuration
│   ├── services/           # External service clients (Stripe, Cloudinary, etc.)
│   └── ...                 # DB, schema, cache, helpers
├── types/                  # Shared TypeScript types
└── utils/                  # Pure utility functions
```

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

3. Create a `.env` file based on `.env.example` and add your environment variables:

```bash
cp .env.example .env
```

4. Push the schema to your Turso database:

```bash
pnpm db:push
```

5. Start the development server:

```bash
pnpm dev
```

## Available Scripts

| Script               | Description                           |
| -------------------- | ------------------------------------- |
| `pnpm dev`           | Start dev server with Turbo and HTTPS |
| `pnpm build`         | Production build                      |
| `pnpm start`         | Start production server               |
| `pnpm lint`          | Run ESLint                            |
| `pnpm lint:fix`      | Run ESLint with auto-fix              |
| `pnpm typecheck`     | Run TypeScript type checking          |
| `pnpm format:check`  | Check Prettier formatting             |
| `pnpm format:write`  | Fix Prettier formatting               |
| `pnpm test`          | Run tests once                        |
| `pnpm test:watch`    | Run tests in watch mode               |
| `pnpm test:coverage` | Run tests with coverage               |
| `pnpm check`         | Run lint + typecheck + tests           |
| `pnpm db:push`       | Push schema changes to database        |
| `pnpm db:generate`   | Generate database migrations           |
| `pnpm db:studio`     | Open Drizzle Studio                    |

## Development Workflow

### Pre-commit Hooks

This project uses [husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) to enforce code quality on every commit:

- **TypeScript/TSX files**: ESLint auto-fix + Prettier formatting
- **JS/JSON/MD/CSS files**: Prettier formatting

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

| Command      | Description                                          |
| ------------ | ---------------------------------------------------- |
| `/ci`        | Add the `run-ci` label to trigger the CI workflow    |
| `/preview`   | Push the PR branch to the deploy repo for a preview  |

Both commands are restricted to repo owners, members, and collaborators.

**Auto-labeling**: PRs are automatically labeled based on changed files (e.g. `ci`, `docs`, `tests`, `admin`, `api`, `components`, `server`, `config`, `dependencies`).

**Releases**: Automatic semantic versioning on push to `main` based on commit message prefixes (`feat:` for minor, `BREAKING` for major, otherwise patch).

**Deploy flow**: On push to `main`, code is synced to a private repo which handles Vercel deployments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue. See our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

Created by [riccardo.lol](https://www.riccardo.lol)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
