# Teknokent Web

Next.js frontend for the Teknokent platform.

Works on macOS, Linux, and Windows.

## Quick Start

Start the backend first, then:

```bash
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run dev
```

- App: http://localhost:3000
- Health API: http://localhost:3000/api/health (proxies backend)

## Configuration

Environment variables (see `.env.example`):

| Variable      | Description                | Default                 |
| ------------- | -------------------------- | ----------------------- |
| `APP_URL`     | Public URL of this web app | `http://localhost:3000` |
| `BACKEND_URL` | Teknokent backend base URL | `http://localhost:8080` |

If a variable is missing, localhost defaults from `src/lib/const.ts` are used.

## Development

```bash
npm run dev          # start dev server
npm run ci           # lint, format check, typecheck, test
npm run build        # production build
npm test             # run tests once
npm run test:watch   # run tests in watch mode
npm run format       # format with Prettier
```

Pull requests to `main` run the GitHub Actions workflow (`.github/workflows/pr-build.yml`).

## Stack

Next.js 16, React 19, TypeScript, TanStack Query, Axios, Tailwind CSS 4, Vitest, Testing Library.

Project layout:

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — UI components
- `src/hooks/` — React hooks
- `src/interfaces/` — shared TypeScript types
- `src/lib/` — app logic (health client, HTTP client, constants)
- `test/` — Vitest tests

## Deployment (AWS Amplify)

Pushing to `main` triggers an automatic deploy on AWS Amplify.

Build settings live in `amplify.yml`. Amplify uses Node 24, runs `npm ci`, writes environment variables to `.env`, then `npm run build`.

Set these in the Amplify console for each branch/environment:

| Variable      | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `APP_URL`     | Deployed web app URL (e.g. `https://main.xxxxx.amplifyapp.com`) |
| `BACKEND_URL` | Production backend URL                                          |

Ensure the backend allows requests from the deployed web app URL if CORS or security rules apply.
