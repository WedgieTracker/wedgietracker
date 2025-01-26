<p align="center">
  <picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/github-logo-dark.svg">
  <img src="public/github-logo-light.svg" width="200" alt="Logo for WedgieTracker">
</picture>
</p>

A modern web application for tracking basketball wedgies.

## Tech Stack

- [T3 Stack](https://github.com/t3-oss/create-t3-app) - Full-stack ecosystem
- [Next.js](https://nextjs.org) - React framework
- [Auth.js](https://authjs.dev/) - Authentication
- [Prisma](https://prisma.io) - Database ORM
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [tRPC](https://trpc.io) - Type-safe API
- [Neon](https://neon.tech) - Serverless Postgres
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

3. Set up your local database:

```bash
# Start the local PostgreSQL database using Docker
./start-database.sh

# Import the local backup dump
pg_restore -d "postgresql://postgres:password@localhost:5432/wedgietracker" local_database.dump
```

4. Create a `.env` file based on `.env.example` and add your environment variables:

```bash
cp .env.example .env
```

Required environment variables:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/wedgietracker"
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

5. Initialize the database:

```bash
pnpm db:push
```

6. Start the development server:

```bash
pnpm dev
```

## Database Management

- Reset database: `pnpm db:push --force-reset`
- Generate Prisma client: `pnpm db:generate`
- Open Prisma Studio: `pnpm db:studio`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue. See our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

Created by [riccardo.lol](https://www.riccardo.lol)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
