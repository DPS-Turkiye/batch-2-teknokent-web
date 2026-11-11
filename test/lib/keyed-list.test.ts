import { describe, expect, it } from "vitest";

import {
  newRowKey,
  occurrenceKeys,
  withKey,
  withKeys,
  withoutKey,
  withoutKeys,
} from "@/lib/keyed-list";

describe("keyed list rows", () => {
  it("gives every row its own key", () => {
    const rows = withKeys([{ title: "A" }, { title: "A" }, { title: "B" }]);

    expect(new Set(rows.map((row) => row.key)).size).toBe(3);
    expect(rows.map((row) => row.title)).toEqual(["A", "A", "B"]);
  });

  it("replaces a key a row already carried, so a restored row cannot collide", () => {
    const taken = newRowKey();
    const restored = withKey({ key: taken, title: "A" });

    expect(restored.key).not.toBe(taken);
  });

  it("takes the key off before the rows leave the browser", () => {
    const rows = withKeys([{ school: "ODTÜ", degree: "", period: "" }]);

    expect(withoutKeys(rows)).toEqual([
      { school: "ODTÜ", degree: "", period: "" },
    ]);
    const [row] = rows;
    expect(row && Object.keys(withoutKey(row))).toEqual([
      "school",
      "degree",
      "period",
    ]);
  });
});

describe("occurrenceKeys", () => {
  it("keys each text by itself and tells repeats apart", () => {
    expect(occurrenceKeys(["A", "B", "A"])).toEqual(["1:A", "1:B", "2:A"]);
  });

  it("stays unique when a text looks like a generated key", () => {
    const keys = occurrenceKeys(["A", "A", "2:A", "1:A"]);
    expect(new Set(keys).size).toBe(4);
  });

  it("keeps the other texts' keys when one is removed", () => {
    const before = occurrenceKeys(["Rapor", "Sunum", "Demo"]);
    const after = occurrenceKeys(["Rapor", "Demo"]);
    expect(after).toEqual([before[0], before[2]]);
  });
});
