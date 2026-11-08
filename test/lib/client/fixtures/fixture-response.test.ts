import { describe, expect, it } from "vitest";

import { fixtureResponse } from "@/lib/client/fixtures/fixture-response";

describe("fixtureResponse", () => {
  it("answers with a copy, so a screen can never change the fixture", async () => {
    const fixture = { items: [{ id: "a" }] };
    const first = await fixtureResponse(fixture);
    first.items.push({ id: "b" });
    expect(first).not.toBe(fixture);
    expect(await fixtureResponse(fixture)).toEqual({ items: [{ id: "a" }] });
  });
});
