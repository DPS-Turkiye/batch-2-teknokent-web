# API routes

Route handlers in `src/app/api/**/route.ts` are a thin backend-for-frontend. They exist to keep the backend's
credentials and the session on the server, and to refuse bad input early. They hold **no business logic**.

## The shape of every handler

```ts
import { z } from "zod";

import { declineMeetingProposal } from "@/lib/api/meeting-proposals";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody, stringOrNullSchema } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

// The reason is optional, and so is the body itself.
const declineSchema = z
  .object({ reason: stringOrNullSchema })
  .default({ reason: null });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getSessionIds(); // 1. who is acting: always the session
    if (!userId) throw new SessionRequiredError();
    const { id } = await params;
    const body = await readJsonBody(request, declineSchema); // 2. validate the body
    if (!body.ok) return body.response; //    400 INVALID_REQUEST
    return backendResponse(
      // 3. one backend call, forwarded as is
      await declineMeetingProposal(userId, id, body.data.reason),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("answerSendFailed"),
    }); // 4. errors
  }
}
```

That is the whole job: **authenticate, validate, forward, map errors.** If a handler grows an `if` about the domain
(deciding a status, computing a date, merging two backend answers), that logic belongs in the backend or in
`src/lib/server` with a test.

## 1. Authentication and authorization

- Signed-in user: `getSessionIds()` or `getSessionUser()` from `src/lib/session.ts`; throw `SessionRequiredError` when
  there is none, and `apiErrorResponse` turns it into a 401.
- Role checks: use a guard from `src/lib/server/require-*.ts`. Each returns `{ ok: true, session }` or
  `{ ok: false, response }`:

  ```ts
  const auth = await requireCoordinatorSession();
  if (!auth.ok) return auth.response;
  ```

  | Guard                                                  | Admits                      |
  | ------------------------------------------------------ | --------------------------- |
  | `requireAdminSession` (`require-admin`)                | admins                      |
  | `requireCoordinatorSession` (`require-coordinator`)    | coordinators **and admins** |
  | `requireCoordinatorSession` (`require-program-access`) | coordinators only           |
  | `requireMentorSession` (`require-program-access`)      | mentors                     |

  The two guards named `requireCoordinatorSession` behave differently. Check which file you import from.

- **Never trust an id from the browser as the actor.** The acting user's id (`actorId`, `userId`) always comes from
  the session. Ids in the URL or body name the _target_ (which meeting, which program); the backend checks the actor
  may touch it. Tests in `test/app/api` send a forged `actorId` to prove it is ignored (`test/fixtures/forged-actor.ts`).

## 2. Validating the body

Use `readJsonBody(request, schema)` from `src/lib/server/request-body.ts` with a zod schema:

- Malformed JSON or a body of the wrong shape answers **400 `INVALID_REQUEST`** with the list of bad `fields`, and the
  backend is never called. Do not coerce bad input into a guessed value (`Number("")` becoming `0`, an unknown enum
  becoming a default): refuse it.
- Object schemas drop unknown keys, so a client cannot smuggle extra fields to the backend.
- An empty body reaches the schema as `undefined`; give the schema a `.default(...)` when the body is optional.
- Use `z.enum(SomeEnum)` for enum fields, `stringOrNullSchema` for optional nullable strings.
- Shared schemas live next to their domain in `src/lib/server` (for example `coordinator-program-schemas.ts`).
- `jsonObjectSchema` is only for routes that deliberately pass an opaque object through (a saved draft).
- Valid input must reach the backend exactly as before. When you tighten a schema, check every client that calls the
  route (`src/lib/client`) still sends a valid body.

Query parameters are untrusted too: parse them into the right type (enum, number, ISO date) with a helper and answer
400 when they are invalid.

## 3. Calling the backend

Each backend endpoint has one function in `src/lib/api/<area>.ts`:

```ts
import "server-only";

export function declineMeetingProposal(
  actorId: string,
  id: string,
  reason: string | null,
) {
  return backendRequest<MeetingProposal>({
    method: "POST",
    url: `${BASE}/${encodeURIComponent(id)}/decline`,
    data: { actorId, reason },
  });
}
```

- `backendRequest` (`src/lib/server/backend-client.ts`) adds Basic auth or a Firebase bearer token, the user's locale
  (`Accept-Language`) and a timeout. It never throws on an HTTP status.
- Always `encodeURIComponent` path segments.
- `BackendResponse<T>` types `data` as `T` for every status. Check `status` before reading `data`; most handlers do not
  read it at all and forward it with `backendResponse`.

## 4. Responses and errors

- `backendResponse(response, forwardedHeaders?)` forwards the backend's status and JSON; pass header names to forward
  (for example a recommendation's `X-Matching-Method`).
- `apiErrorResponse(error, { message })` in the `catch`: 401 for a missing session, 504 for a backend timeout, 502
  otherwise, always with a translated message from `apiText(key)` (keys live under `apiErrors` in the messages).
- Never return an error's details, a stack trace or a raw backend error you did not mean to expose.

## 5. Tests

Every handler has a test in `test/app/api/` that covers: refusal without a session or the right role, the exact
backend call for a valid body (with the actor from the session), 400 for malformed JSON and each invalid shape, and
error mapping. `test/app/api/body-validation.ts` is a table-driven harness: a new validation case is one table row.

## Checklist

- [ ] Session or guard first; actor id from the session.
- [ ] Body validated with `readJsonBody` and a zod schema; enums with `z.enum`.
- [ ] Exactly one `src/lib/api` call, forwarded with `backendResponse`.
- [ ] `catch` with `apiErrorResponse` and a translated message.
- [ ] No domain logic in the handler.
- [ ] Tests for auth, the valid call, invalid bodies and errors.
