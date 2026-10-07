import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const API_DIR = path.resolve(__dirname, "../../../src/app/api");

const AUTH_CHECK = /\b(getSession\w*|require\w*Session|readBearerToken)\s*\(/;

// Answering without a session is deliberate for these. botapi and
// transcriptapi stay listed until H2 gives them a session check.
const PUBLIC_ROUTES = new Set([
  "botapi/report/route.ts",
  "botapi/route.ts",
  "health/route.ts",
  "programs/names/route.ts",
  "transcriptapi/route.ts",
]);

const routes = readdirSync(API_DIR, { recursive: true })
  .map(String)
  .filter((file) => path.basename(file) === "route.ts")
  .map((file) => file.split(path.sep).join("/"));

describe("API route auth guard", () => {
  it("finds the route handlers", () => {
    expect(routes.length).toBeGreaterThan(50);
  });

  it("checks the session or a bearer token in every non-public route", () => {
    const unguarded = routes.filter(
      (route) =>
        !PUBLIC_ROUTES.has(route) &&
        !AUTH_CHECK.test(readFileSync(path.join(API_DIR, route), "utf8")),
    );
    expect(unguarded).toEqual([]);
  });

  it("lists only public routes that still exist", () => {
    expect(
      [...PUBLIC_ROUTES].filter((route) => !routes.includes(route)),
    ).toEqual([]);
  });
});
