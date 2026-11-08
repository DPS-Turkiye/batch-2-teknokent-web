import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

describe("office-hours availability copy", () => {
  it.each([
    ["Turkish", tr],
    ["English", en],
  ])(
    "has every key the mentor availability dialog's frame reads, plus the student limit, in %s",
    (_lang, messages) => {
      expect(Object.keys(messages.officeHours.availability).sort()).toEqual(
        [
          ...Object.keys(messages.mentorProfile.dialog),
          "studentCapacity",
        ].sort(),
      );
    },
  );
});
