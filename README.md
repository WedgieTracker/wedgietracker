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

Required environment variables:

```env
TURSO_DATABASE_URL="libsql://your-db-name.turso.io"
TURSO_AUTH_TOKEN=""
NEXTAUTH_URL="https://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
INSTAGRAM_CLIENT_ID=""
INSTAGRAM_CLIENT_SECRET=""
INSTAGRAM_BUSINESS_ACCOUNT_ID=""
INSTAGRAM_ACCESS_TOKEN=""
MAILCHIMP_API_KEY=""
MAILCHIMP_SERVER_PREFIX=""
MAILCHIMP_LIST_ID=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

4. Push the schema to your Turso database:

```bash
pnpm db:push
```

5. Start the development server:

```bash
pnpm dev
```

## Database Management

- Push schema changes: `pnpm db:push`
- Generate migrations: `pnpm db:generate`
- Open Drizzle Studio: `pnpm db:studio`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue. See our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

Created by [riccardo.lol](https://www.riccardo.lol)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
