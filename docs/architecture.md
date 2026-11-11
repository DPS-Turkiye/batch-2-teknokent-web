# Architecture

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 6 · TanStack Query 5 · axios · zod 4 · next-intl · zustand ·
Tailwind CSS 4 · Vitest with Testing Library. Authentication uses Firebase on the client and an encrypted
iron-session cookie on the server. The data and the business rules of record live in the Spring Boot backend.

> This Next.js version differs from older ones. Before using a Next.js API, read its guide in
> `node_modules/next/dist/docs/`.

## The big picture

The browser never talks to the backend directly. It talks to this app's own `/api/*` route handlers (a
backend-for-frontend, BFF), which hold the session, add the backend credentials, and forward one call to the backend.

```
Browser                                    Next.js server                         Spring backend
───────                                    ──────────────                         ──────────────
component (view)
   │ renders data, calls callbacks
   ▼
hook (src/hooks)
   │ state, TanStack Query, mutations
   ▼
browser client (src/lib/client)
   │ httpClient → /api/...      ───────►  route handler (src/app/api/**/route.ts)
                                             │ session/guard, zod body check
                                             ▼
                                          backend client (src/lib/api)
                                             │ backendRequest + Basic auth  ───►  REST API
                                             ▼                                     (actorId from session)
                                          backendResponse(...)  ◄──────────────
   ◄────────────── JSON ─────────────────
```

Server components (pages without `"use client"`) skip the browser half: they read the session and call `src/lib`
loaders on the server, then pass the data to client components as props. About a quarter of the pages are client
components that load their data through hooks.

## Folders

| Folder                       | Contents                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                   | Routes. `page.tsx` and `layout.tsx` per route; `src/app/api/` holds the route handlers. `src/app/m/` is the mobile web app.                             |
| `src/components/`            | React components, grouped by feature (`admin/`, `coordinator/`, `mentorships/`…) plus `common/` for shared UI and `hoc/` for shells such as `AppShell`. |
| `src/hooks/`                 | One `use-*.ts` per screen or concern. The only place a component gets data or state from.                                                               |
| `src/lib/`                   | Pure domain logic and shared helpers, one module per concept (`meeting-proposals.ts`, `calendar.ts`, `utils.ts`…).                                      |
| `src/lib/client/`            | Browser-side calls to `/api/*`.                                                                                                                         |
| `src/lib/api/`               | Server-only calls to the backend. Each module imports `server-only`.                                                                                    |
| `src/lib/server/`            | Server-only shared code: guards, `readJsonBody`, zod schemas, response helpers, the backend HTTP client.                                                |
| `src/lib/const/`             | Constants (URLs, limits, option lists).                                                                                                                 |
| `src/interfaces/`            | Domain and API types and their enums. `index.ts` re-exports the common ones.                                                                            |
| `src/types/`                 | UI-only types and enums (view models, tabs, app areas).                                                                                                 |
| `src/stores/`                | Small zustand stores for app-wide UI state (toasts, document preview).                                                                                  |
| `src/i18n/`, `src/messages/` | next-intl setup and the message catalogs.                                                                                                               |
| `src/proxy.ts`               | The request proxy (formerly "middleware"): sign-in redirects, mobile/web routing, session cookie clean-up. It skips `/api/*`.                           |
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

One small function per endpoint of this app's own API:

```ts
export async function declineMeetingProposal(id: string, reason: string) {
  return requireSuccess(
    await httpClient.post<MeetingProposal>(
      `/api/meeting-proposals/${encodeURIComponent(id)}/decline`,
      {
        reason: reason.trim() || null,
      },
    ),
  );
}
```

`httpClient` never throws on HTTP status; `requireSuccess` returns `data` on 2xx and otherwise throws a
`ClientApiError` carrying the backend's message, code and field errors.

### Route handlers: `src/app/api/**/route.ts`

Thin by rule: session or guard, `readJsonBody` with a zod schema, one call into `src/lib/api`, `backendResponse` or
`apiErrorResponse`. See [API routes](api-routes.md).

### Backend clients: `src/lib/api/*.ts`

Server-only functions that call the backend with `backendRequest`, which adds Basic auth (or a Firebase bearer token)
and the request's locale. They take the acting user's id as a parameter; the route handler passes it from the session.

## Sessions, roles and workspaces

- **Signing in.** Firebase authenticates in the browser; the app then creates an iron-session cookie on the server.
  `getSessionUser()` and `getSessionIds()` (`src/lib/session.ts`) read it in server code; `useSession()` and
  `useAppSession()` (`src/components/providers/session-provider.tsx`) expose it to client components.
- **Roles.** `UserRole` (`src/interfaces/session.ts`): mentee, mentor, coordinator, admin. `hasPermission`
  (`src/lib/permissions.ts`) decides access. Guards in `src/lib/server/require-*.ts` turn that into 401/403 responses.
- **Account types.** `AccountType` (`src/interfaces/account-type.ts`): `teknokent` and `odtu`. ODTÜ accounts get extra
  workspaces (student, academician, office hours) and a text overlay (see [i18n](i18n.md)).
- **Mobile.** `src/app/m/` is a separate mobile web app; `src/proxy.ts` sends phones there unless the visitor chose
  the web version.

## Error handling

- Backend errors reach the browser with their status, `code` and a user-facing `message`.
- Route handlers catch everything with `apiErrorResponse(error, { message })`: a `SessionRequiredError` becomes 401
  `SESSION_REQUIRED`, a backend timeout 504 `BACKEND_TIMEOUT`, and anything else 502 `BACKEND_UNAVAILABLE` with the
  translated `message` you pass. The error is logged on the server; its details never reach the browser.
- An invalid request body is a 400 `INVALID_REQUEST` from `readJsonBody`, before the backend is called.
- In the browser, `ClientApiError` carries `status`, `code` and `fieldErrors`. Hooks turn failures into toasts or
  inline errors with `errorMessage(error, fallback)` from `src/lib/utils.ts`.

## Security headers and cookies

`next.config.ts` sets the Content Security Policy and other security headers for every route
(`test/next-config.test.ts` pins them). The session cookie is encrypted with `SESSION_PASSWORD`, HTTP-only, and
cleared by the proxy when it no longer decrypts.
