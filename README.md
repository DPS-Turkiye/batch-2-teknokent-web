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

| Variable                       | Description                              | Default                 |
| ------------------------------ | ---------------------------------------- | ----------------------- |
| `APP_URL`                      | Public URL of this web app               | `http://localhost:3000` |
| `BACKEND_URL`                  | Teknokent backend base URL               | `http://localhost:8080` |
| `BACKEND_USERNAME`             | Server-side backend Basic Auth username  | `teknokent`                                   |
| `BACKEND_PASSWORD`             | Server-side backend Basic Auth password  | `change-me`                                   |
| `SESSION_PASSWORD`             | Encryption key for iron-session cookies  | (min 32 characters)                           |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional Google Calendar OAuth client ID | empty                                         |

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

Set these in the Amplify console for each branch/environment:

| Variable      | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `APP_URL`     | Deployed web app URL (e.g. `https://main.xxxxx.amplifyapp.com`) |
| `BACKEND_URL` | Production backend URL                                          |

Ensure the backend allows requests from the deployed web app URL if CORS or security rules apply.
