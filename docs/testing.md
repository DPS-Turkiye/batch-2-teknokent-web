# Testing

Tests run on [Vitest](https://vitest.dev) with jsdom and Testing Library. They are type-checked (`tsc -p test`) and
linted like production code, and CI enforces coverage floors.

## What to test

| Code                        | Test                                                                                                | Location                              |
| --------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Pure logic in `src/lib`     | Unit tests: inputs, edge cases, every branch.                                                       | `test/lib/…`                          |
| Hooks                       | `renderHook` with a query client: state transitions, what is sent, invalidation, errors.            | `test/hooks/…`                        |
| Components and pages        | Render, interact with `userEvent`, assert what the user sees and what was called.                   | `test/components/…`, `test/app/…`     |
| Route handlers              | Auth refusals, the exact backend call (actor from the session), 400s for bad bodies, error mapping. | `test/app/api/…`                      |
| Browser and backend clients | URL, method, payload, and how failures surface.                                                     | `test/lib/client/…`, `test/lib/api/…` |

The test file mirrors the source path: `src/lib/meeting-context.ts` → `test/lib/meeting-context.test.ts`. When a
module's test file grows large, add a second file with a descriptive suffix (`meeting-context-branches.test.ts`).

A bug fix comes with a test that fails without the fix.

## Writing good tests

- **Test behavior, not implementation.** Query by role and accessible name (`getByRole("button", { name: "Kaydet" })`),
  not by class or test id. Assert outcomes: text on screen, the payload sent, the query invalidated.
- **The title says what is verified:** `"refuses a plan with a week number given as text"`, not `"works"`.
- **Unconditional assertions.** No `expect` inside `if` or `catch` (`vitest/no-conditional-expect`); use
  `await expect(promise).rejects.toThrow(…)`.
- **Exact payloads.** Check what reaches an API with `toHaveBeenCalledWith` or `toEqual`. `toMatchObject` ignores
  extra fields, so it would not catch a leaked field (such as a React row key).
- **No snapshots.** They hide what matters and get updated without reading.
- **Time.** Pin the clock with `vi.useFakeTimers()` / `vi.setSystemTime(…)` when a result depends on today. The suite
  runs with `TZ=Europe/Istanbul` (`vitest.config.mts`) so clock times match on every machine.
- **No real network.** Mock at the module boundary (`vi.mock("@/lib/client/meetings", …)`). jsdom's URL points at
  `http://localhost:9`, where nothing listens, so an unmocked request fails loudly.

## Typed mocks, no casts

`as unknown as T` and `as never` are lint errors in tests too. Build complete, typed values:

| Need                                          | Use                                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A `useQuery` result                           | `successQuery(data)`, `loadingQuery()`, `failedQuery(error)`, `idleQuery()` from `test/mocks/query-results.ts`. TanStack builds them, so every field is real.                                                         |
| A `useMutation` result                        | `idleMutation({ mutateAsync })`, `pendingMutation(variables)` from the same file.                                                                                                                                     |
| A view-model hook (`useMentorDashboard`…)     | A factory that returns the complete `ReturnType<typeof useX>` with defaults and takes `Partial<…>` overrides. Shared ones go to `test/fixtures` (for example `signupWizardStub` in `test/fixtures/signup-wizard.ts`). |
| Domain objects                                | The fixtures in `test/fixtures/` (`mentorshipRequest()`, `program()`, `mentorProfile`, `memberFixture()`…). Search before writing a new one.                                                                          |
| Backend and axios responses                   | `createAxiosResponse` (`test/fixtures/health.ts`); `backendResponse`, `backendRefusal`, `guardRefusal` (`test/fixtures/route-handlers.ts`).                                                                           |
| Sessions                                      | `appSession()`, `backendUser()` (`test/fixtures/session.ts`).                                                                                                                                                         |
| A typed callback                              | `vi.fn<Type["callback"]>()`.                                                                                                                                                                                          |
| Index access under `noUncheckedIndexedAccess` | `expectLength(items, n)` and `itemAt(items, i)` from `test/fixtures/list-assertions.ts`.                                                                                                                              |
| A forged actor id                             | `withForgedActor(input)` (`test/fixtures/forged-actor.ts`).                                                                                                                                                           |

If a mock is hard to type, that usually means the test stubs more than it should, or the source type is wrong. Fix
the cause rather than casting.

## Rendering helpers

`test/test-utils.tsx`:

- `renderWithQueryClient(ui)` renders with a fresh `QueryClient` (no retries).
- `createTestQueryClient()` for `renderHook` wrappers.
- `<InLocale locale="tr">` wraps a tree in the real messages for that locale.

`test/setup.ts` adds what jsdom lacks (Web Crypto and streams in the vm pool, `matchMedia`, `scrollIntoView`, a
`getComputedStyle` fallback) and the jest-dom matchers. Add a missing browser API there, once, rather than guarding
for it in `src`.

## Route handler tests

`test/app/api/body-validation.ts` is a table-driven harness. A route's validation cases are one table: a valid body
with the exact backend call it must produce, and named invalid bodies that must answer 400 without calling the
backend. Add a row when you add a field.

## Running tests

| Command                               | Use                                                             |
| ------------------------------------- | --------------------------------------------------------------- |
| `npx vitest run test/lib/foo.test.ts` | One file while you work.                                        |
| `npm run test:watch`                  | Watch mode.                                                     |
| `npm test`                            | The whole suite in the fast `vmForks` pool (about 30 s).        |
| `npm run test:coverage`               | What CI runs: the `forks` pool, V8 coverage and the thresholds. |

## Coverage

`vitest.config.mts` sets floors for statements, branches, functions and lines just under the measured coverage. CI
fails when a change drops below them. Raise them when coverage grows; never lower them to get a change through.
