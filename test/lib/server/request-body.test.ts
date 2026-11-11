import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  jsonObjectSchema,
  readJsonBody,
  stringOrNullSchema,
} from "@/lib/server/request-body";
import tr from "@/messages/tr.json";

const schema = z.object({
  name: z.string(),
  count: z.number(),
  note: stringOrNullSchema,
});

function post(body: string | null) {
  return new Request("http://localhost", { method: "POST", body });
}

async function refusal(result: Awaited<ReturnType<typeof readJsonBody>>) {
  if (result.ok) throw new Error("expected the body to be refused");
  expect(result.response.status).toBe(400);
  return (await result.response.json()) as {
    code: string;
    message: string;
    fields: string[];
  };
}

describe("readJsonBody", () => {
  it("answers the parsed body, without fields the schema does not know", async () => {
    const result = await readJsonBody(
      post(JSON.stringify({ name: "Kavşak", count: 3, actorId: "someone" })),
      schema,
    );

    expect(result).toEqual({
      ok: true,
      data: { name: "Kavşak", count: 3, note: null },
    });
  });

  it("refuses malformed JSON with its own message", async () => {
    const body = await refusal(await readJsonBody(post("{name:"), schema));

    expect(body).toEqual({
      code: "INVALID_REQUEST",
      message: tr.apiErrors.invalidRequestBody,
      fields: [],
    });
  });

  it("refuses a body of the wrong shape, naming the fields", async () => {
    const body = await refusal(
      await readJsonBody(post(JSON.stringify({ name: 7, count: "3" })), schema),
    );

    expect(body).toEqual({
      code: "INVALID_REQUEST",
      message: tr.apiErrors.invalidRequestFields,
      fields: ["name", "count"],
    });
  });

  it("names nested fields by their path", async () => {
    const teams = z.object({
      teams: z.array(z.object({ leadEmail: z.string() })),
    });
    const body = await refusal(
      await readJsonBody(
        post(JSON.stringify({ teams: [{ leadEmail: "a@b.co" }, {}] })),
        teams,
      ),
    );

    expect(body.fields).toEqual(["teams.1.leadEmail"]);
  });

  it("uses the route's own text for a body of the wrong shape", async () => {
    const body = await refusal(
      await readJsonBody(post(JSON.stringify({})), schema, {
        invalidMessage: "programNameRequired",
      }),
    );

    expect(body.message).toBe(tr.apiErrors.programNameRequired);
  });

  it("hands a missing body to the schema, so only a schema with a default accepts it", async () => {
    const optional = z
      .object({ reason: stringOrNullSchema })
      .default({ reason: null });

    expect(await readJsonBody(post(null), optional)).toEqual({
      ok: true,
      data: { reason: null },
    });
    await refusal(await readJsonBody(post(null), schema));
  });

  it("refuses an array or null where any JSON object is expected", async () => {
    await refusal(await readJsonBody(post("[]"), jsonObjectSchema));
    await refusal(await readJsonBody(post("null"), jsonObjectSchema));
    expect(
      await readJsonBody(post(JSON.stringify({ a: 1 })), jsonObjectSchema),
    ).toEqual({ ok: true, data: { a: 1 } });
  });
});
