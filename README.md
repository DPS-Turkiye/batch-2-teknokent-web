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

| Variable                                   | Description                              | Default                  |
| ------------------------------------------ | ---------------------------------------- | ------------------------ |
| `APP_URL`                                  | Public URL of this web app               | `http://localhost:3000`  |
| `BACKEND_URL`                              | Teknokent backend base URL               | `http://localhost:8080`  |
| `BACKEND_USERNAME`                         | Server-side backend Basic Auth username  | `teknokent`              |
| `BACKEND_PASSWORD`                         | Server-side backend Basic Auth password  | `change-me`              |
| `SESSION_PASSWORD`                         | Encryption key for iron-session cookies  | (min 32 characters)      |
| `NEXT_PUBLIC_REALTIME_URL`                 | Browser WebSocket URL for live notes     | `ws://localhost:8080/ws` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`             | Optional Google Calendar OAuth client ID | empty                    |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase web API key                     | empty                    |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain                     | empty                    |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID                      | empty                    |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase web app ID                      | empty                    |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID                       | empty                    |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket                  | empty                    |

If a variable is missing, localhost defaults from `src/lib/const/` are used.
Firebase login stays off until the three required `NEXT_PUBLIC_FIREBASE_*` keys are set.

## Documentation

New to the codebase? Read [`docs/`](docs/README.md), starting with
[getting started](docs/getting-started.md) and [architecture](docs/architecture.md). The binding repository rules
for people and coding agents are in [`AGENTS.md`](AGENTS.md).

## Development

```bash
npm run dev            # start dev server
npm run ci             # lint, format check, typecheck (src + test), tests with coverage thresholds
npm run build          # production build
npm test               # run tests once
npm run test:watch     # run tests in watch mode
npm run lint:fix       # ESLint with autofix
npm run format         # format with Prettier
```

`npm install` enables Husky git hooks: pre-commit lints and formats the staged files, pre-push runs the type check
and the tests. Pull requests and pushes to `main` run the full pipeline in GitHub Actions
(`.github/workflows/pr-build.yml`). See [quality gates](docs/quality-gates.md).

## Stack

Next.js 16, React 19, TypeScript 6, TanStack Query, Axios, zod, next-intl, zustand, Tailwind CSS 4, Vitest,
Testing Library.

Project layout (details in [architecture](docs/architecture.md)):

- `src/app/` — App Router pages, and the API route handlers in `src/app/api/`
- `src/components/` — UI components, grouped by feature
- `src/hooks/` — screen state and data fetching
- `src/lib/` — domain logic and shared helpers; `client/` (browser → `/api`), `api/` and `server/` (server → backend)
- `src/interfaces/`, `src/types/` — domain/API types and UI-only types
- `src/messages/` — UI text (Turkish source, English)
- `test/` — Vitest tests, mirroring `src/`

## Implemented MVP features

The responsive, Figma-aligned frontend includes:

| Route                    | Purpose                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/`                      | Public landing page with announcements, mentorship information, programs, filters, FAQ, and footer                                 |
| `/login`                 | Demo mentee selection and session creation; production authentication is intentionally deferred                                    |
| `/workspace`             | Program/workspace selection                                                                                                        |
| `/dashboard`             | Database-backed mentee dashboard and request/meeting summaries                                                                     |
| `/profile`               | Consent-aware CV or pitch-deck upload, OCR choice, editable parsing review, manual fallback, confirmation, and local form clearing |
| `/mentor-request`        | Five-stage, sticky mentorship-request flow with request-specific mentor recommendations at stage 4                                 |
| `/mentor-request/sent`   | Persisted submission confirmation                                                                                                  |
| `/mentor-request/status` | Live request status, withdrawal, alternative mentors, and accepted-request scheduling                                              |
| `/mentors/compare`       | Selected mentor profile/comparison view                                                                                            |
| `/calendar`              | Meeting calendar with optional Google Calendar connection                                                                          |
| `/mentor-dashboard`      | Current mentor-facing prototype shell                                                                                              |

The mentor recommendation stage sends the current request topic, summary,
urgency, format and meeting preference to Spring Boot. The backend combines them
with the confirmed mentee/startup profile, applies eligibility, ranks the mentor
pool, and returns `Neden önerildi?` reasons plus confirmed-profile evidence. The
frontend does not call AI providers or expose provider keys; all AI access remains
behind Spring Boot.

Profile fields are populated from the latest backend analysis. **Temizle** clears
only the current browser form so data from a previous screen/session is not shown;
it does not delete the stored backend/database record.

The code-facing route and folder names are English. Visible labels and page
content remain Turkish. The former `/giris` and `/calisma-alani` URLs redirect
to their English replacements for backward compatibility.

Backend credentials are used only by server-side API routes and are never exposed
as `NEXT_PUBLIC_*` variables.

## End-to-end MVP test

1. Start the Docker backend and PostgreSQL as described in the backend README.
2. Start this app with `npm run dev`, open `http://localhost:3000/login`, and
   choose a seeded mentee account.
3. Open `/profile`, accept consent, upload a PDF, choose `OCR'ı zorla` for scanned
   or complex CVs, review the extracted fields, and confirm the profile.
4. From `/dashboard`, create a request and complete stages 1–3.
5. At stage 4 select **Önerileri Hazırla**, inspect the recommendation reasons and
   evidence, select a mentor, and submit at stage 5.
6. Verify the request on `/mentor-request/status`, the dashboard, Swagger, or the
   PostgreSQL tables described in the backend README.

## Deployment (AWS Amplify)

Pushing to `main` triggers an automatic deploy on AWS Amplify.

Build settings live in `amplify.yml`. Amplify uses Node 24, runs `npm ci`, writes environment variables to `.env`, then `npm run build`.

Set these in the Amplify console (app-level env). `amplify.yml` writes every key into `.env` before `npm run build`:

| Variable                                | Description                                                        |
| --------------------------------------- | ------------------------------------------------------------------ |
| `APP_URL`                               | Deployed web app URL (`https://main.dxcmjf7esever.amplifyapp.com`) |
| `BACKEND_URL`                           | CloudFront HTTPS API origin                                        |
| `BACKEND_USERNAME` / `BACKEND_PASSWORD` | Spring HTTP Basic auth                                             |
| `SESSION_PASSWORD`                      | iron-session cookie key (min 32 characters)                        |
| `NEXT_PUBLIC_REALTIME_URL`              | `wss://<cdn_domain>/ws` — never `ws://` on Amplify HTTPS           |
| `NEXT_PUBLIC_FIREBASE_*`                | Firebase web app config (same project as backend SSM)              |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`          | Optional Google Calendar OAuth client ID                           |

Ensure the backend allows requests from the deployed web app URL if CORS or security rules apply.
