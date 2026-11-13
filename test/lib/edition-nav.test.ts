import { describe, expect, it } from "vitest";

import { Edition } from "@/interfaces/edition";
import { openNavItems } from "@/lib/edition-nav";

const items = [
  { href: "/student/office-hours", label: "officeHours" },
  { href: "/assistant", label: "assistant" },
  { href: "/coordinator/programs", label: "programs" },
];

describe("openNavItems", () => {
  it("keeps only the pages the deployment serves, in order", () => {
    expect(openNavItems(Edition.Odtu, items)).toEqual([
      { href: "/student/office-hours", label: "officeHours" },
      { href: "/coordinator/programs", label: "programs" },
    ]);
    expect(openNavItems(Edition.Teknokent, items)).toEqual([
      { href: "/assistant", label: "assistant" },
      { href: "/coordinator/programs", label: "programs" },
    ]);
  });
});
