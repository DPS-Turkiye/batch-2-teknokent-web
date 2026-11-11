# Coding standards

The binding list is in [`AGENTS.md`](../AGENTS.md). This page explains each rule and shows how to follow it. Most of
these rules are enforced by ESLint or TypeScript; when a check fails, fix the code rather than the check.

## Separation of concerns

### Views render, hooks decide

```tsx
// ✗ The view decides what is overdue (with a string literal) and builds the payload.
function TaskList({ tasks }: { tasks: ActionItem[] }) {
  const overdue = tasks.filter((task) => task.status !== "COMPLETED" && Date.parse(task.dueDate) < Date.now());
  const save = () => httpClient.put("/api/action-items", { ids: overdue.map((task) => task.id) });
  …
}

// ✓ The rule is a tested pure function in src/lib; a hook composes it; the view renders.
export function overdueItems(items: readonly ActionItem[], now: Date) {
  return items.filter(
    (item) => item.status !== ActionItemStatus.Completed && Date.parse(item.dueDate) < now.getTime(),
  );
}
// The hook returns { overdue, markAllDone, isSaving }; the component calls it and renders.
```

A view may keep trivial UI state (an open menu, a hovered row). Anything a product person would call a rule (who may
do what, what counts as late, which items to show, what to send) goes to `src/lib` or a hook.

### Route handlers forward, they do not decide

See [API routes](api-routes.md). A handler authenticates, validates, makes one backend call and maps errors.

## TypeScript

The compiler runs with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`,
`noImplicitOverride` and `noImplicitReturns`, for `src` and `test` alike.

- **No escape hatches.** No `any`, `as unknown as T`, `as never`, `@ts-ignore` or `@ts-expect-error`; no non-null `!`
  in `src`. ESLint rejects double casts and `as never`. A plain `value as unknown` is fine: it is how you take
  untrusted data before narrowing it.
- **Index access may be `undefined`.** `items[0]` has type `T | undefined`. Narrow it (`const first = items[0]; if
(!first) return …`), use `.at(-1)` with a guard, or restructure. Do not reach for `!`.
- **Optional is not the same as `undefined`.** With `exactOptionalPropertyTypes`, `title?: string` means "may be
  absent", and assigning `undefined` is an error. If a value can legitimately be `undefined` (a prop passed through),
  declare `title?: string | undefined`.
- **Model the backend's `null` honestly.** The backend's JSON includes absent values as `null` (Jackson's default). A
  field it may leave empty is `T | null` (or `T | null | undefined` when it can also be missing), never `T` or `T?`.
  When you find a lie, fix the type and let the compiler show you every place that must handle the empty case.
- **Validate at trust boundaries.** Request bodies: zod in the route handler. `JSON.parse`, `localStorage`, URL params,
  `postMessage`: read as `unknown`, then narrow with a type guard.
- **Imports.** Type-only imports use `import type` or inline `type` (enforced). Import order is handled by Prettier.
  Use the `@/` alias for `src` and `@test/` in tests, not long relative paths.

## Enums, not string literals

Domain values (statuses, roles, kinds, categories) are TypeScript string enums in `src/interfaces` (or `src/types`
for UI-only values). Their values match what the backend sends.

```ts
// ✗
if (meeting.status === "COMPLETED") …
if (user.role === String(UserRole.Coordinator)) …   // dodges the lint rule, defeats its purpose
// ✓
if (meeting.status === MeetingStatus.Completed) …
```

- Type the field as the enum (`status: MeetingStatus`), so comparisons and `switch` statements are checked.
  `switch-exhaustiveness-check` then reports a missing `case` when an enum grows.
- Turn an untrusted string (a URL parameter, a `<select>` value, parsed JSON) into an enum once, at the boundary,
  with `isEnumValue(MeetingStatus, value)` or `isOneOf(list, value)` from `src/lib/enum.ts`. In route handlers, use
  `z.enum(MeetingStatus)`.
- Search before adding an enum. Do not create a second enum with an existing name; two `MeetingStatus` enums already
  exist (`src/interfaces/meeting.ts` for meetings, `src/types/assistant.ts` for the transcript bot) and must not be
  mixed.
- The same goes for other magic values: use named constants from `src/lib/const` instead of repeating a number or a
  path.

## Reuse before you write

Search before adding a helper (`grep -rn "function format" src/lib`). If two files need the same function, move it to
`src/lib` and import it from both. Common helpers:

| Need                                            | Use                                                                                                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dates and times for display                     | `src/lib/utils.ts`: `formatCalendarDay`, `formatDateTime`, `formatTimeRange`, `formatLongDate`, `formatDayMonth`, `formatShortDate`, `relativeDayLabel`, `dayPart`, `calendarDay`, `toDateTimeLocalValue` |
| Slot and meeting labels                         | `src/lib/format.ts`: `formatSlotDateTime`, `formatMeetingShort`                                                                                                                                           |
| Calendar grids and weeks                        | `src/lib/calendar.ts`: `startOfWeek`, `weekDays`, `monthGridCells`, `isSameDay`, `weekRangeLabel`, `timeLabel`                                                                                            |
| Text and numbers                                | `src/lib/utils.ts`: `initials`, `truncate`, `formatFileSize`, `isEmailAddress`, `httpUrlOrNull`                                                                                                           |
| An error to show a user                         | `errorMessage(error, fallback)` in `src/lib/utils.ts`                                                                                                                                                     |
| Untrusted value → enum                          | `isEnumValue`, `isOneOf` in `src/lib/enum.ts`                                                                                                                                                             |
| `unknown` → `string[]`                          | `stringList` in `src/lib/string-list.ts`                                                                                                                                                                  |
| Stable React keys for editable rows             | `withKey`, `withKeys`, `withoutKeys`, `newRowKey`, `occurrenceKeys` in `src/lib/keyed-list.ts`                                                                                                            |
| Polling a query                                 | `polling(POLL_INTERVAL.x)`, `whenVisible` in `src/lib/poll.ts`                                                                                                                                            |
| Meet links                                      | `normalizeMeetLink`, `meetLinkHref` in `src/lib/meet-link.ts`                                                                                                                                             |
| Role checks                                     | `hasPermission`, `hasAnyPermission` in `src/lib/permissions.ts`                                                                                                                                           |
| HTTP verbs                                      | the `HttpMethod` enum in `src/lib/http-method.ts`                                                                                                                                                         |
| Browser → this app's API                        | `httpClient` (`src/lib/http-client.ts`) with `requireSuccess` (`src/lib/client/api.ts`)                                                                                                                   |
| Server → backend                                | `backendRequest` (`src/lib/server/backend-client.ts`)                                                                                                                                                     |
| Route body validation, responses                | `readJsonBody`, `stringOrNullSchema` (`src/lib/server/request-body.ts`); `backendResponse`, `apiErrorResponse`, `apiText` (`src/lib/server/api-response.ts`)                                              |
| Object URLs, client-side pagination, inline add | `useObjectUrl`, `useClientPagination`, `useInlineEntry` in `src/hooks`                                                                                                                                    |
| Toasts                                          | `useToast()` from `src/stores/toast-store.ts`                                                                                                                                                             |
| Shared UI pieces                                | `src/components/common` (buttons, dialogs, empty states, pagination, steppers…)                                                                                                                           |

A new general helper goes into the module for its concept (or a new one), gets a doc comment and a unit test.

## Lists and keys

- Rows that can be added, removed or reordered get a stable key from `src/lib/keyed-list.ts`: `withKey` when a row is
  created, `withKeys` when a list is loaded, and `withoutKeys` before it is sent or saved. A restored draft is always
  re-keyed. Never use the index for such rows: removing one would hand the next row's DOM, focus and state to another.
- Lists rebuilt from text on every render (chips parsed from a string) use `occurrenceKeys`.
- Index keys are acceptable only for lists that never reorder or shrink (a fixed set of slots, static copy), with an
  `eslint-disable-next-line react/no-array-index-key -- <reason>`.

## React

- Client components start with `"use client"`. Keep pages server components when they only need server data.
- Effects synchronize with the outside world (subscriptions, timers, the DOM). Derived values are computed during
  render or with `useMemo`, not copied into state by an effect.
- Promises are never left floating: `await` them, or mark a deliberate fire-and-forget with `void`.
- Accessibility: every control has a label (visible or `aria-label`), buttons are `<button type="button">`, images
  have `alt`. `jsx-a11y` rules run in lint.
- Use `next/image` for images (`unoptimized` for `blob:` previews) and `next/link` for internal links.

## Naming and files

- Files are `kebab-case`; one main concept per file. Components are `PascalCase`, hooks `useCamelCase`, constants
  `SCREAMING_SNAKE_CASE`, enum members `PascalCase` with `SCREAMING_SNAKE_CASE` values that match the backend.
- Names say what something is in the domain's words (`overdueItems`, `canPropose`), not how it is computed.
- A screen still waiting for its final design starts with
  `// TEST UI: placeholder until the design team's screen; replace when it arrives.`

## Comments

- Write a comment when the reason is not obvious from the code: a constraint, a backend quirk, a decision. Keep it to
  one or two sentences, and keep it true when the code changes.
- Do not narrate what the code does, leave commented-out code, or leave TODOs without an owner and an issue.
- Code, identifiers and comments are in English. UI copy is in Turkish first and lives in the message catalogs.

## Lint suppressions

`// eslint-disable-next-line <rule> -- <reason>` only when the rule is genuinely wrong for that line, with the reason
written out. A directive without a reason, or one that no longer suppresses anything, fails lint. Never disable a rule
for a whole file or change the config to get a change through.
