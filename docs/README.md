# Developer documentation

This folder explains how the Teknokent web app is built and how to change it safely. The short, binding version of
the rules is [`AGENTS.md`](../AGENTS.md) at the repository root; these pages give the reasoning and the examples.

## Reading order for a new developer

1. [Getting started](getting-started.md): set up, run, and the daily workflow.
2. [Architecture](architecture.md): the layers, where each kind of code goes, and how a request travels.
3. [Coding standards](coding-standards.md): TypeScript, enums, nulls, naming, and the helpers to reuse.
4. [Calling the backend](backend-calls.md): the API's session cookie, writing a call, and this app's two routes.
5. [Data fetching and state](data-fetching.md): hooks, TanStack Query, mutations, drafts and editable lists.
6. [Internationalization](i18n.md): UI text, typed message keys, and the ODTÜ overlay.
7. [Testing](testing.md): what to test, where, and how to build mocks without casts.
8. [Quality gates](quality-gates.md): lint, type checking, coverage, git hooks and CI, and why each is set the way it is.

## The rules in one paragraph

Views render; hooks hold screen state and data fetching; pure rules live in `src/lib` with unit tests. The browser
calls the backend directly on the API's own session cookie; the backend decides who may do what. Domain values are enums, never string
literals. Types describe what the backend really sends, including `null`. No `any`, no double casts, no `!`. Every
user-facing string is a message key. Reuse the helpers that exist. `npm run ci` must pass.
