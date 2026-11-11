# Quality gates

Every change passes the same checks locally and in CI. This page lists them and why each is configured the way it is,
so that nobody has to guess whether a rule may be relaxed. (It may not, without a team decision.)

## The pipeline

| Step   | Command                 | Fails on                                                                           |
| ------ | ----------------------- | ---------------------------------------------------------------------------------- |
| Lint   | `npm run lint`          | Any ESLint error **or warning** (`--max-warnings=0`).                              |
| Format | `npm run format:check`  | A file Prettier would change.                                                      |
| Types  | `npm run typecheck`     | A type error in `src` (`tsconfig.json`) or in `test` (`test/tsconfig.json`).       |
| Tests  | `npm run test:coverage` | A failing test, or coverage under the thresholds in `vitest.config.mts`.           |
| Build  | `npm run build`         | A production build error (CI only; run it yourself for routing or config changes). |

`npm run ci` runs the first four. GitHub Actions (`.github/workflows/pr-build.yml`) runs all five on every pull request
and on every push to `main`, with read-only permissions, and cancels superseded runs.

### Git hooks (Husky)

- **pre-commit:** `lint-staged` runs `eslint --fix` and Prettier on the staged files only, so commits stay fast.
- **pre-push:** `npm run typecheck` and `npm test`.

`git commit --no-verify` skips the hooks, not CI.

## TypeScript (`tsconfig.json`)

TypeScript 6 with `strict` plus:

| Option                                                                  | Why                                                                               |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `noUncheckedIndexedAccess`                                              | `items[0]` may be `undefined`; the compiler makes you handle it.                  |
| `exactOptionalPropertyTypes`                                            | "Absent" and "`undefined`" are different; payloads and props say which they mean. |
| `verbatimModuleSyntax`                                                  | Type-only imports are erased predictably; no accidental runtime imports of types. |
| `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` | Catch inheritance and control-flow slips.                                         |
| `allowUnreachableCode: false`, `allowUnusedLabels: false`               | Dead code is an error.                                                            |

`test/tsconfig.json` extends the root config and also includes `src/**/*.d.ts`, so tests see the same global types
(typed message keys, CSS custom properties) as the app.

## ESLint (`eslint.config.mjs`)

Built on `eslint-config-next` (Next.js, React, hooks and accessibility rules) and TanStack Query's rules, plus:

- **typescript-eslint `strictTypeChecked` and `stylisticTypeChecked`**, type-aware through the project service. They
  catch floating promises, unsafe `any` flows, unnecessary conditions, enum comparisons with strings, and more.
- `switch-exhaustiveness-check`: a `switch` over an enum must handle every member.
- `consistent-type-assertions`: no `{ … } as T` object literals except as call arguments.
- `no-restricted-syntax` bans `as unknown as T` and `as never`, and comparing or switching on an UPPER_CASE string
  literal (`status === "ACTIVE"`, `case "IN_PROGRESS":`): domain values go through enums.
- `require-array-sort-compare`, `eqeqeq`, `no-param-reassign`, `no-implicit-coercion`, `no-console` (warn and error
  allowed), `react/jsx-no-leaked-render`, `react/no-array-index-key`.
- **ESLint comments:** a suppression must name its rule and give a reason; unused suppressions are errors.
- **Tests:** `@vitest/eslint-plugin` (no focused or disabled tests, no conditional expects, valid `expect` usage). The
  `no-unsafe-*` family is off for tests, because type safety there comes from `tsc -p test`.

Import order is Prettier's job (`@ianvs/prettier-plugin-sort-imports`), not ESLint's, so the two never fight.

## Tests and coverage (`vitest.config.mts`)

- `npm test` uses the `vmForks` pool: one jsdom per worker, a fresh window per file. It is about twice as fast as a
  new process per file.
- `npm run test:coverage` (CI) uses plain `forks`: under V8 coverage the vm pool was slower and once crashed a worker.
- Vitest suggests `isolate: false` for speed. It is deliberately not used: files would share the module registry,
  mocks and globals, and results would depend on file order.
- Coverage floors sit just under the measured values; raise them as coverage grows.

## Decisions worth knowing

- **ESLint and Prettier, not oxlint and oxfmt (November 2026).** oxfmt was still pre-1.0 and changing output between
  releases; oxlint's type-aware rules need TypeScript 7, and its ESLint-plugin support was alpha. Next.js documents
  ESLint and Biome. Revisit when oxfmt reaches 1.0.
- **TypeScript 6, not 7.** typescript-eslint supports TypeScript up to 6.0.x; TypeScript 7.0 has no JavaScript API yet.
- **Cache Components are not enabled yet.** Turning on `cacheComponents` is a migration (route segment configs, Suspense
  boundaries around session-reading pages), planned as its own piece of work before the next Next.js major makes it
  the default.
