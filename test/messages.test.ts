import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

/** Every leaf path with the {placeholders} its message uses. */
function leaves(value: unknown, path = ""): Record<string, string[]> {
  if (typeof value === "string") {
    // Plural branches such as "=3 {üç}" or "one {# member}" are text, not placeholders.
    const args = value.replace(
      /(?:=\d+|zero|one|two|few|many|other)\s*\{[^{}]*\}/g,
      "",
    );
    const names = [...args.matchAll(/\{(\w+)/g)].map((match) => match[1]);
    return { [path]: [...new Set(names)].sort() };
  }
  if (Array.isArray(value)) {
    return Object.assign(
      {},
      ...value.map((item, index) => leaves(item, `${path}.${index}`)),
    );
  }
  return Object.assign(
    {},
    ...Object.entries(value as Record<string, unknown>).map(([key, item]) =>
      leaves(item, path ? `${path}.${key}` : key),
    ),
  );
}

describe("messages", () => {
  it("gives English every Turkish key, list item and placeholder", () => {
    expect(leaves(en)).toEqual(leaves(tr));
  });
});
