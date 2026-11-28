# Calling the backend

The browser calls the Spring backend (`https://api.menton.com.tr`, `NEXT_PUBLIC_BACKEND_URL`) itself. There is no
backend-for-frontend in between: this app holds no session and no backend credential.

## Signing in and the session

1. Firebase signs the person in, in the browser.
2. The Firebase ID token is traded once for the API's own session: `startBackendSession(idToken, remember)`
   (`src/lib/client/backend-http.ts`) posts to `/api/auth/session` with the token as a bearer.
3. The backend answers with an HttpOnly session cookie on its own host. Every later call sends it
   (`withCredentials`); this code never sees it.
4. The backend takes the caller from that cookie alone. Nothing the browser sends names the caller: there is no
   `actorId`, and an id in a path or body only says which of the caller's own things is meant. The backend refuses
   any it may not touch.

`readSession()` (`src/lib/client/session.ts`) reads the account from `/api/auth/me`; `useSession()` and
`useAppSession()` (`src/components/providers/session-provider.tsx`) give it to components. A first-party cookie
(`src/lib/session-hint.ts`) tells `src/proxy.ts` that the browser looks signed in; it only picks which page loads
first and is never trusted for access.

## Writing a call

One function per endpoint in `src/lib/client/<area>.ts`, through `backendHttp` and `requireSuccess`:

```ts
export async function declineMeetingProposal(id: string, reason: string) {
  return requireSuccess(
    await backendHttp.post<MeetingProposal>(
      `/api/meeting-proposals/${encodeURIComponent(id)}/decline`,
      {
        reason: reason.trim() || null,
      },
    ),
  );
}
```

- `backendHttp` never throws on an HTTP status; `requireSuccess` returns `data` on 2xx and otherwise throws a
  `ClientApiError` with the backend's message, code and field errors. A 401 starts a session from the tab's
  Firebase sign-in and sends the call once more.
- `signedInUserId()` gives the caller's own account id when a path needs it (`/api/mentors/{own id}/…`). Never use
  it, or anything else the browser knows, for an access decision: the backend makes those.
- `withToken(idToken)` is only for onboarding calls made before a session exists.
- A file download: `backendHttp` with `responseType: "blob"`, and the browser saves it.
- Reshaping a response, or combining calls, goes in the client module or in a pure `src/lib` function with a test.

Tests mock the module with
`vi.mock("@/lib/client/backend-http", async () => (await import("@test/mocks/backend-http")).backendHttpMock())`
and check each call with `itSendsEachClientCall(calls, backendHttp)` from `@test/fixtures/client-calls`.

## This app's own routes

Only two route handlers remain, and `test/app/api/routes.test.ts` keeps it that way. Neither reads a session or sends
a credential.

- `src/app/api/health`: the frontend's health check; it asks the backend's `/api/health`.
- `src/app/api/email-unsubscribe`: the one-click `List-Unsubscribe` URL in mail already sent. It checks the link's
  token and posts it to the backend's public `/api/email-center/unsubscribe`; the token is the only proof.

They use `apiText`, `invalidRequest`, `backendResponse` and `apiErrorResponse` from `src/lib/server/api-response.ts`.
Do not add another route that calls the backend for a signed-in person: call the backend from the browser instead.
