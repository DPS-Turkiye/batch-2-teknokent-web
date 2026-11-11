<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository rules

These rules apply to every change, by people and by coding agents. The reasoning behind them, with examples, is in [`docs/`](docs/README.md). Start with [`docs/architecture.md`](docs/architecture.md) and [`docs/coding-standards.md`](docs/coding-standards.md).

## Definition of done

- `npm run ci` passes: lint (zero warnings), Prettier, `tsc` for `src` and `test`, and the test suite with coverage thresholds.
- `npm run build` passes when you touched routing, config, or server code.
- New or changed logic has tests. Coverage floors in `vitest.config.mts` are never lowered.
- Do not loosen `eslint.config.mjs`, `tsconfig.json`, `test/tsconfig.json` or the coverage thresholds to make a change pass. If a rule is wrong for a case, say so in the PR.

## Where code goes

| Layer                | Folder                                     | Owns                                                                                                       |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Views                | `src/app/**/page.tsx`, `src/components/**` | Rendering and wiring events to callbacks. Nothing else.                                                    |
| Hooks                | `src/hooks/use-*.ts`                       | Screen state, TanStack Query calls, mutations, toasts, derived values for a view.                          |
| Domain logic         | `src/lib/*.ts`                             | Pure functions: rules, calculations, formatting, mapping. No React, no network. Unit-tested in `test/lib`. |
| Browser API clients  | `src/lib/client/*.ts`                      | Calls from the browser to this app's own `/api/*` routes through `httpClient` and `requireSuccess`.        |
| Route handlers (BFF) | `src/app/api/**/route.ts`                  | Session check, body validation, one call to `src/lib/api`, response mapping. Nothing else.                 |
| Backend clients      | `src/lib/api/*.ts`                         | Server-only calls to the Spring backend through `backendRequest`.                                          |
| Server helpers       | `src/lib/server/*.ts`                      | Shared server logic: guards, request-body parsing, schemas, response helpers.                              |
| Contracts and enums  | `src/interfaces/*.ts`                      | Types and enums for domain data and API payloads.                                                          |
| UI-only types        | `src/types/*.ts`                           | View models and UI enums that never cross the API.                                                         |
| UI text              | `src/messages/{tr,en}.json`                | Every user-facing string. `tr.json` is the source of truth.                                                |

## Rules

1. **Views have no business logic.** A component renders what a hook gives it and calls the hook's callbacks. Filtering, sorting, status decisions, date math and payload building live in a hook or in `src/lib`. A pure function that a view needs goes to `src/lib` and gets a unit test.
2. **Route handlers have no business logic.** A handler resolves the session or a guard, validates the body with `readJsonBody(request, schema)` (zod), calls one `src/lib/api` function and returns `backendResponse(...)` or `apiErrorResponse(...)`. Shared server logic goes to `src/lib/server`. See [`docs/api-routes.md`](docs/api-routes.md).
3. **Identity comes from the session, never from the request.** `actorId` and `userId` sent to the backend are taken from the session. Never forward an id the browser sent as "who is acting".
4. **Use enums, not string literals, for domain values.** Compare against enum members (`status === MeetingStatus.Completed`), never against `"COMPLETED"`, and never against `String(Enum.X)`. Type fields as the enum. Turn untrusted strings into enums once, at the boundary, with `isEnumValue` or `isOneOf` from `src/lib/enum.ts`. Before adding an enum, search for an existing one; do not create a second enum with the same name. Lint rejects comparing or switching on an UPPER_CASE string literal. When a value is free text on the backend, compare against a named `as const` object (like `HttpMethod` or `MatchingMethod`).
5. **Reuse before you write.** Search `src/lib` before adding a helper. The common ones are listed in [`docs/coding-standards.md`](docs/coding-standards.md#reuse-before-you-write). One concept has one helper; if two files need the same function, move it to `src/lib` and import it from both.
6. **No type escape hatches.** No `any`, no `as unknown as T`, no `as never`, no non-null `!` in `src`, no `@ts-ignore` or `@ts-expect-error`. ESLint enforces most of this. Fix the type instead: narrow, guard, or correct the declaration.
7. **Types tell the truth about the backend.** The backend sends absent values as `null`, so a nullable field is `T | null`, not `T?`. Validate data that crosses a trust boundary (request bodies with zod; parsed JSON as `unknown`, then narrowed).
8. **No hardcoded UI text.** Every string a user can see is a key in `src/messages/tr.json` (and `en.json`). Code, comments and identifiers are in English; UI copy is in Turkish first.
9. **Editable lists use stable keys.** Rows that can be added, removed or reordered carry a key from `src/lib/keyed-list.ts`, which is stripped before sending. Index keys are only for lists that never reorder or shrink, with a `-- reason`.
10. **Suppressions need a reason.** `// eslint-disable-next-line rule -- why` only when the rule is genuinely wrong for that line. Unused or reason-less directives fail lint.
11. **Tests mirror `src`.** `src/lib/foo.ts` is tested in `test/lib/foo.test.ts`. Build typed fixtures (`test/fixtures`, `test/mocks/query-results.ts`) instead of casting. Test behavior, not implementation. See [`docs/testing.md`](docs/testing.md).
12. **Comments say why, not what.** Write a short comment for a non-obvious decision or constraint. Do not narrate the code.

## Known traps

- `MeetingStatus` exists twice: `src/interfaces/meeting.ts` (meetings, upper case) and `src/types/assistant.ts` (the transcript bot, lower case). Do not mix them.
- `BackendResponse<T>` types `data` as `T` for every status, error responses included. Check `status` before reading `data`.
