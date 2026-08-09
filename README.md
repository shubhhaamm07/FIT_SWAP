# FitSwap

FitSwap is a full-stack marketplace for transferable gym memberships. Members can manage memberships and list unused time for sale, gym owners can manage their gyms and operations, and administrators can moderate the platform.

The application consists of a React single-page app, an Express API, and a PostgreSQL database managed with Prisma.

## Features

### Members

- Register, sign in, maintain a profile, and manage notification preferences.
- Browse approved gyms and their membership plans.
- Purchase, freeze, resume, and review membership history.
- Create and manage marketplace listings for eligible memberships.
- Search, filter, sort, save, and purchase listings.
- Track transfer requests, notifications, wishlists, and account settings.

### Gym owners

- Access a role-protected owner dashboard.
- Manage gyms, membership plans, images, members, sales, and transfers.
- Review operational and revenue data.

### Administrators

- Access a role-protected administration portal.
- Review platform analytics, gym approvals, listings, announcements, and audit logs.
- Send announcements to selected platform audiences.

### Platform capabilities

- JWT-protected API endpoints and role-based authorization.
- Password hashing with bcrypt.
- API and authentication rate limiting.
- Scheduled jobs for membership expiry, listing expiry, and stale transfer requests.
- PostgreSQL data model with Prisma migrations and seed data.
- Optional S3-backed gym and profile image uploads.
- Docker Compose setup for the web app, API, and PostgreSQL.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Axios |
| UI and visualisation | Lucide React, Framer Motion, Recharts |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL 16, Prisma ORM |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Storage | AWS S3-compatible uploads (optional) |
| Deployment | Docker, Docker Compose, Nginx |

## Project structure

```text
FitSwap/
├── Client/                  # React and Vite frontend
│   ├── src/
│   │   ├── api/             # Axios API clients
│   │   ├── components/      # Reusable UI and feature components
│   │   ├── context/         # Auth and toast providers
│   │   ├── pages/           # Member, owner, and admin pages
│   │   └── routes/          # Protected and role-based routes
│   ├── Dockerfile
│   └── nginx.conf
├── Server/                  # Express API
│   ├── prisma/              # Prisma schema, migrations, and seed script
│   └── src/
│       ├── controllers/     # HTTP request handlers
│       ├── services/        # Application/business logic
│       ├── middlewares/     # Authentication, authorization, uploads, limits
│       ├── routes/          # API route definitions
│       └── jobs/            # Scheduled maintenance jobs
├── docker-compose.yml
└── .env.example             # Docker Compose environment template
```

## Prerequisites

- Node.js 22 or later
- npm
- PostgreSQL 16 or later for local development, or Docker Desktop for the containerized setup

## Quick start with Docker

This is the simplest way to start the full system.

1. Create the root environment file.

   ```bash
   cp .env.example .env
   ```

2. Set secure values in `.env` for:

   ```env
   POSTGRES_PASSWORD=your-postgres-password
   JWT_SECRET=your-long-random-jwt-secret
   JWT_REFRESH_SECRET=your-different-long-random-refresh-secret
   ```

3. Build and start all services.

   ```bash
   docker compose up --build
   ```

4. Open [http://localhost:5173](http://localhost:5173).

The Nginx frontend proxies browser requests from `/api` to the API container. PostgreSQL is available only to the Docker network; the API applies pending Prisma migrations at startup.

To add the demo data after the services are running:

```bash
docker compose exec api node prisma/seed.js
```

## Local development setup

### 1. Create a PostgreSQL database

Create a local database named `fitswap_` (or choose your own name) and ensure PostgreSQL is running on port `5432`.

### 2. Configure the API

Create `Server/.env` with your local settings:

```env
PORT=8000
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/fitswap_?schema=public"
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret

# Optional: needed only for image upload endpoints.
AWS_REGION=
AWS_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

Do not commit this file or any real credentials.

### 3. Install dependencies

```bash
cd Server
npm ci

cd ../Client
npm ci
```

### 4. Apply migrations and seed demo data

```bash
cd Server
npx prisma migrate deploy
npm run seed
```

For local schema iteration during development, use `npx prisma migrate dev` instead of `migrate deploy`.

### 5. Run the application

Start the API in one terminal:

```bash
cd Server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd Client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). In local development the frontend sends API calls to `http://localhost:8000/api` by default.

## Demo accounts

After `npm run seed`, these accounts use password `1234`:

| Role | Email |
| --- | --- |
| Administrator | `shubham.rana@fitswap.test` |
| Gym owner | `owner1@fitswap.test` through `owner5@fitswap.test` |
| Member | `member01@fitswap.test` through `member20@fitswap.test` |

`membership1@fitswap` is not a seeded account. If a user is inserted directly in the database, its password must be stored as a bcrypt hash; plain-text passwords cannot authenticate. Prefer the registration endpoint or the seed script for creating development users.

## API overview

All endpoints are prefixed with `/api`.

| Area | Base route | Purpose |
| --- | --- | --- |
| Health | `/health` | Confirm that the API is running |
| Authentication | `/auth` | Register, login, profile, settings, password, and account actions |
| Gyms | `/gyms` | Browse and manage gyms and gym images |
| Memberships | `/memberships`, `/membership-plans` | Membership plans, purchases, status actions, and history |
| Marketplace | `/marketplace` | Listings, search/filtering, listing lifecycle, and purchases |
| Transfers | `/transfer-requests` | Submit and process membership transfers |
| Saved listings | `/saved-listings` | Wishlist actions |
| Notifications | `/notifications` | Read and update notifications |
| Dashboards | `/dashboard`, `/gym-owner` | Member and owner reporting data |
| Administration | `/admin` | Analytics, moderation, announcements, and audit logs |

Use the health endpoint to confirm the API is reachable:

```bash
curl http://localhost:8000/api/health
```

## Authentication and authorization

- `POST /api/auth/login` returns a JWT and user profile data.
- The frontend stores the token locally and sends it as `Authorization: Bearer <token>`.
- Protected API routes use the `protect` middleware.
- Role-specific actions require `USER`, `GYM_OWNER`, or `ADMIN` authorization as appropriate.
- Login normalizes email input by trimming whitespace and converting it to lowercase.

## Available commands

### Frontend

```bash
cd Client
npm run dev       # Start Vite development server
npm run build     # Create production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

### Backend

```bash
cd Server
npm run dev       # Start API with nodemon
npm start         # Start API with Node.js
npm run seed      # Seed demo users, gyms, memberships, and listings
npx prisma validate
npx prisma migrate status
```

## Troubleshooting

### Login returns “Invalid credentials”

1. Confirm the email is a real seeded or registered email. Use `member01@fitswap.test`, not `membership1@fitswap`.
2. Run the seed script and use password `1234` for demo accounts.
3. Check that PostgreSQL is running and that `DATABASE_URL` points to the same database where you seeded users.
4. Do not insert plain-text passwords directly in the `User.password` column. The app compares passwords using bcrypt.

### Database cannot be reached at `localhost:5432`

- Start your local PostgreSQL service. If you use Docker, start the complete stack with `docker compose up --build` rather than running the API locally against the private Compose database.
- Verify the database name, username, password, hostname, and port in `Server/.env`.
- Apply migrations before seeding: `npx prisma migrate deploy`.

### Docker Compose reports missing environment variables

Copy `.env.example` to the root `.env` file and set `POSTGRES_PASSWORD`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.

### Frontend cannot call the API in Docker

Use the provided Compose setup. Its build injects `VITE_API_URL=/api`, and Nginx forwards `/api` traffic to the API service.

## Security notes

- Never commit `.env` files, database URLs, JWT secrets, or AWS credentials.
- Rotate credentials if they have been exposed in source control or shared files.
- Use strong, unique values for production JWT secrets and database passwords.
- Replace demo accounts and passwords before deploying the application.

## License

No license has been specified for this project yet.
