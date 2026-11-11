# Getting started

## Prerequisites

- Node.js 24 (the version CI and AWS Amplify use) and npm.
- The Teknokent backend (Spring Boot) running locally, by default on `http://localhost:8080`. This app is a frontend and
  a thin proxy; almost every screen needs the backend.

## First run

```bash
cp .env.example .env    # Windows: copy .env.example .env
npm install             # also installs the git hooks (Husky)
npm run dev             # http://localhost:3000
```

`.env.example` documents every variable. The important ones:

- `BACKEND_URL`, `BACKEND_USERNAME`, `BACKEND_PASSWORD`: how the server side of this app reaches the backend.
- `SESSION_PASSWORD`: at least 32 random characters; it encrypts the session cookie.
- `NEXT_PUBLIC_*`: values the browser may see (Firebase web config, the realtime WebSocket URL, feature flags).

Never commit `.env`. Anything prefixed `NEXT_PUBLIC_` ends up in the browser bundle, so it must not be a secret.

## Scripts

| Command                 | What it does                                                              |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm run dev`           | Development server.                                                       |
| `npm run build`         | Production build (also type-checks through `tsc`).                        |
| `npm run lint`          | ESLint, failing on any warning.                                           |
| `npm run lint:fix`      | ESLint with autofix.                                                      |
| `npm run format`        | Prettier on the whole repo.                                               |
| `npm run typecheck`     | `tsc` for `src` and for `test`.                                           |
| `npm test`              | The test suite once (fast `vmForks` pool).                                |
| `npm run test:watch`    | Tests in watch mode.                                                      |
| `npm run test:coverage` | Tests with coverage and the coverage thresholds (what CI runs).           |
| `npm run ci`            | Everything CI checks except the build: lint, format, typecheck, coverage. |

## Daily workflow

1. Branch from `main`.
2. Make the change in the right layer (see [architecture](architecture.md)), with tests.
3. Commit. The pre-commit hook runs ESLint and Prettier on the staged files only (lint-staged).
4. Push. The pre-push hook runs `npm run typecheck` and `npm test`.
5. Open a pull request to `main`. GitHub Actions runs lint, format check, typecheck, tests with coverage, and the
   production build. All must pass.

Commit messages describe the outcome for users, as in the existing history, for example:
`Program › Onaylar tab shows how many approvals are waiting (#313)`.

## Editor

The repository recommends the ESLint, Prettier and Tailwind CSS extensions (`.vscode/extensions.json`) and formats on
save. Keep both extensions enabled; CI rejects unformatted files and lint warnings.

## When something fails

- **Lint error:** fix the code. If the rule is genuinely wrong for one line, use
  `// eslint-disable-next-line <rule> -- <reason>`. Never edit the ESLint config to get past it.
- **Type error in `test/`:** tests are type-checked too. Build a complete typed value; see [testing](testing.md).
- **Coverage below the threshold:** add tests for the code you changed. Do not lower the threshold.
