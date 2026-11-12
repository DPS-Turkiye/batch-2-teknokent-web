import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const API_DIR = path.resolve(__dirname, "../../../src/app/api");

// The office-hours readers are the session the LTI launch from Moodle signs into.
const AUTH_CHECK =
  /\b(getSession\w*|getOfficeHoursUser|requireOfficeHoursUser|require\w*Session|readBearerToken)\s*\(/;
// allowlistedProxy cannot be built without requireUserId, so its handlers are guarded when it is passed.
const PROXY_HANDLERS =
  /^export\s+const\s+\{([^}]+)\}\s*=\s*allowlistedProxy\b[\s\S]*?\brequireUserId:/m;
const HANDLER =
  /^export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/;

// Answering without a session is deliberate for these handlers.
const PUBLIC_HANDLERS = new Set([
  // Deployment-wide AI switches; the signup CV step reads them before there is a session.
  "ai-features/route.ts GET",
  "auth/password-reset/route.ts POST",
  "health/route.ts GET",
  // Signing in through an institution happens before there is a session; the backend verifies the login.
  "institution-login/[provider]/complete/route.ts POST",
  "institution-login/[provider]/start/route.ts POST",
  "institution-login/dev-personas/route.ts GET",
  "programs/names/route.ts GET",
  "session/route.ts DELETE",
]);

const routes = readdirSync(API_DIR, { recursive: true })
  .map(String)
  .filter((file) => path.basename(file) === "route.ts")
  .map((file) => file.split(path.sep).join("/"));

/** Each top-level function's source, keyed by name. */
function functionsOf(source: string) {
  const starts = [
    ...source.matchAll(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm),
  ];
  const functions = new Map<string, string>();
  starts.forEach((match, index) => {
    const [, name] = match;
    if (name === undefined) return;
    const end = starts[index + 1]?.index ?? source.length;
    functions.set(name, source.slice(match.index, end));
  });
  return functions;
}

/** A handler is guarded when it, or a local helper it calls, checks auth. */
function isGuarded(
  name: string,
  functions: Map<string, string>,
  seen = new Set<string>(),
): boolean {
  const body = functions.get(name);
  if (!body || seen.has(name)) return false;
  seen.add(name);
  if (AUTH_CHECK.test(body)) return true;
  return [...functions.keys()].some(
    (other) =>
      other !== name &&
      new RegExp(`\\b${other}\\s*\\(`).test(body) &&
      isGuarded(other, functions, seen),
  );
}

const handlers = routes.flatMap((route) => {
  const source = readFileSync(path.join(API_DIR, route), "utf8");
  const functions = functionsOf(source);
  const proxied = (PROXY_HANDLERS.exec(source)?.[1] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((method) => ({ id: `${route} ${method}`, guarded: true }));
  return [...functions.values()]
    .map((body) => HANDLER.exec(body)?.[1] ?? null)
    .filter((method): method is string => method !== null)
    .map((method) => ({
      id: `${route} ${method}`,
      guarded: isGuarded(method, functions),
    }))
    .concat(proxied);
});

describe("API route auth guard", () => {
  it("finds the route handlers", () => {
    expect(handlers.length).toBeGreaterThan(100);
  });

  it("checks the session or a bearer token in every non-public handler", () => {
    const unguarded = handlers
      .filter(({ id, guarded }) => !guarded && !PUBLIC_HANDLERS.has(id))
      .map(({ id }) => id);
    expect(unguarded).toEqual([]);
  });

  it("sees the handlers an allowlisted proxy builds", () => {
    const ids = handlers.map(({ id }) => id);
    expect(ids).toContain(
      "office-hours/courses/[courseId]/[...path]/route.ts POST",
    );
  });

  it("lists only public handlers that still exist", () => {
    const ids = new Set(handlers.map(({ id }) => id));
    expect([...PUBLIC_HANDLERS].filter((id) => !ids.has(id))).toEqual([]);
  });
});
