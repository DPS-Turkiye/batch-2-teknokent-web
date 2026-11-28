import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const API_DIR = path.resolve(__dirname, "../../../src/app/api");

const routes = readdirSync(API_DIR, { recursive: true })
  .map(String)
  .filter((file) => path.basename(file) === "route.ts")
  .map((file) => file.split(path.sep).join("/"))
  .sort();

describe("this app's own API routes", () => {
  // The browser calls the backend itself, on the API's session cookie; nothing here acts for a signed-in user.
  it("are only the health check and the unsubscribe link in mail", () => {
    expect(routes).toEqual(["email-unsubscribe/route.ts", "health/route.ts"]);
  });

  it("send no credential and read no session", () => {
    const sources = routes.map((route) =>
      readFileSync(path.join(API_DIR, route), "utf8"),
    );
    for (const source of sources) {
      expect(source).not.toMatch(/session|Authorization|auth:/i);
    }
  });
});
