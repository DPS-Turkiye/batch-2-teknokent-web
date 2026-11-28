# Architecture

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 6 · TanStack Query 5 · axios · zod 4 · next-intl · zustand ·
Tailwind CSS 4 · Vitest with Testing Library. Authentication uses Firebase in the browser, traded once for the API's
own HttpOnly session cookie. The data and the business rules of record live in the Spring Boot backend.

> This Next.js version differs from older ones. Before using a Next.js API, read its guide in
> `node_modules/next/dist/docs/`.

## The big picture

The browser talks to the backend (`https://api.menton.com.tr`) directly, on the API's own HttpOnly session cookie.
The backend takes the caller from that cookie and decides what they may see and do. This app's server renders pages
and serves two routes of its own (the health check and the unsubscribe link in mail); it holds no session and no
backend credential.

```
Browser                                                             Spring backend
───────                                                             ──────────────
component (view)
   │ renders data, calls callbacks
   ▼
hook (src/hooks)
   │ state, TanStack Query, mutations
   ▼
browser client (src/lib/client)
   │ backendHttp → /api/...  (withCredentials)  ───────────────►   REST API
   │                                                                 caller = the session cookie's principal
   ◄──────────────────────────── JSON ───────────────────────────
```

Signing in: Firebase authenticates in the browser, and the Firebase ID token is traded once for the session cookie
(`startBackendSession`, `src/lib/client/backend-http.ts`). See [Calling the backend](backend-calls.md).

## Folders

| Folder                       | Contents                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                   | Routes. `page.tsx` and `layout.tsx` per route; `src/app/api/` holds this app's two routes. `src/app/m/` is the mobile web app.                          |
| `src/components/`            | React components, grouped by feature (`admin/`, `coordinator/`, `mentorships/`…) plus `common/` for shared UI and `hoc/` for shells such as `AppShell`. |
| `src/hooks/`                 | One `use-*.ts` per screen or concern. The only place a component gets data or state from.                                                               |
| `src/lib/`                   | Pure domain logic and shared helpers, one module per concept (`meeting-proposals.ts`, `calendar.ts`, `utils.ts`…).                                      |
| `src/lib/client/`            | Browser-side calls to the backend through `backendHttp`.                                                                                                |
| `src/lib/api/`               | The unsubscribe route's credential-free backend call. Imports `server-only`.                                                                            |
| `src/lib/server/`            | Server-only shared code: the account type and edition, the token schema and response helpers of the two routes.                                         |
| `src/lib/const/`             | Constants (URLs, limits, option lists).                                                                                                                 |
| `src/interfaces/`            | Domain and API types and their enums. `index.ts` re-exports the common ones.                                                                            |
| `src/types/`                 | UI-only types and enums (view models, tabs, app areas).                                                                                                 |
| `src/stores/`                | Small zustand stores for app-wide UI state (toasts, document preview).                                                                                  |
| `src/i18n/`, `src/messages/` | next-intl setup and the message catalogs.                                                                                                               |
| `src/proxy.ts`               | The request proxy (formerly "middleware"): sign-in redirects from the signed-in hint, mobile/web routing. It skips `/api/*`.                            |
| `test/`                      | Tests, mirroring `src/`, plus `fixtures/`, `mocks/` and setup.                                                                                          |

## Layers and their responsibilities

### Views: `src/app/**/page.tsx` and `src/components/**`

Render and wire events. A view may hold trivial UI-only state (is a menu open), but no business rules: it does not
filter, sort, compute statuses, build request payloads or decide what a user may do. That belongs to a hook or to
`src/lib`. A component that grows its own helper functions is a sign that logic should move out.

### Hooks: `src/hooks/use-*.ts`

A hook turns data and rules into exactly what a view needs: values, flags such as `isSaving` and `canSave`, and
callbacks such as `save()`. It owns TanStack Query calls, mutations, cache invalidation, toasts and form state. It
delegates rules to `src/lib` so they can be unit-tested without React. See [data fetching](data-fetching.md).

### Domain logic: `src/lib/*.ts`

Pure functions with no React and no network: deciding a meeting's state, grouping meetings by week, validating a
form, mapping a backend shape to a view shape. Each module has a unit test in `test/lib/`. Before adding a helper,
look for an existing one (see [coding standards](coding-standards.md#reuse-before-you-write)).

### Browser clients: `src/lib/client/*.ts`

One small function per backend endpoint, through `backendHttp` and `requireSuccess`. `backendHttp` never throws on
HTTP status; `requireSuccess` returns `data` on 2xx and otherwise throws a `ClientApiError` carrying the backend's
message, code and field errors. Nothing sent names the caller (no `actorId`). See [Calling the backend](backend-calls.md).

## Sessions, roles and workspaces

- **Signing in.** Firebase authenticates in the browser; its ID token is traded once for the API's HttpOnly session
  cookie. `useSession()` and `useAppSession()` (`src/components/providers/session-provider.tsx`) give the account
  from `/api/auth/me` to client components. Server code cannot see that cookie.
- **Roles.** `UserRole` (`src/interfaces/session.ts`): mentee, mentor, coordinator, admin. `hasPermission`
  (`src/lib/permissions.ts`) decides what the UI shows; the backend decides access and answers 401/403.
- **Account types.** `AccountType` (`src/interfaces/account-type.ts`): `teknokent` and `odtu`. ODTÜ accounts get extra
  workspaces (student, academician, office hours) and a text overlay (see [i18n](i18n.md)).
- **Mobile.** `src/app/m/` is a separate mobile web app; `src/proxy.ts` sends phones there unless the visitor chose
  the web version.

## Error handling

- Backend errors reach the browser with their status, `code` and a user-facing `message`.
- This app's two routes catch everything with `apiErrorResponse(error, { message })`: a backend timeout is 504
  `BACKEND_TIMEOUT`, anything else 502 `BACKEND_UNAVAILABLE` with the translated `message`. The error is logged on
  the server; its details never reach the browser.
- In the browser, `ClientApiError` carries `status`, `code` and `fieldErrors`. Hooks turn failures into toasts or
  inline errors with `errorMessage(error, fallback)` from `src/lib/utils.ts`.

## Security headers and cookies

`next.config.ts` sets the Content Security Policy and other security headers for every route
(`test/next-config.test.ts` pins them). The session cookie belongs to the API's host: HttpOnly, set and cleared by
the backend. This host keeps only the signed-in hint (`src/lib/session-hint.ts`), which is never trusted for access.
