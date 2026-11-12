import { describe, expect, it } from "vitest";

import { IA_MESSAGES } from "@/i18n/ia-messages";
import { Locale } from "@/lib/i18n";
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
    const names = [...args.matchAll(/\{(\w+)/g)]
      .map((match) => match[1])
      .filter((name) => name !== undefined);
    return { [path]: [...new Set(names)].sort() };
  }
  if (Array.isArray(value)) {
    return Object.assign(
      {},
      ...value.map((item, index) => leaves(item, `${path}.${index}`)),
    );
  }
  if (typeof value !== "object" || value === null) return {};
  return Object.assign(
    {},
    ...Object.entries(value).map(([key, item]: [string, unknown]) =>
      leaves(item, path ? `${path}.${key}` : key),
    ),
  );
}

describe("messages", () => {
  it("gives English every Turkish key, list item and placeholder", () => {
    expect(leaves(en)).toEqual(leaves(tr));
  });

  it("gives English every Turkish key of the IA Revizyon catalogs", () => {
    expect(leaves(IA_MESSAGES[Locale.En])).toEqual(
      leaves(IA_MESSAGES[Locale.Tr]),
    );
  });
});
