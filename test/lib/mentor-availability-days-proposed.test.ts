import { describe, expect, it } from "vitest";

import {
  parseProposedSlotsFromMessage,
  PROPOSED_TIMES_LINE_PREFIX,
} from "@/lib/mentor-availability-days";

describe("parseProposedSlotsFromMessage", () => {
  it("answers no slots for an empty message or one without proposed times", () => {
    expect(parseProposedSlotsFromMessage(null)).toEqual([]);
    expect(parseProposedSlotsFromMessage("Merhaba\nGörüşelim")).toEqual([]);
  });

  it("reads the human-written line of an older message, keeping each label and its time", () => {
    const message = `Uygun saatler aşağıda.\n${PROPOSED_TIMES_LINE_PREFIX} 12 Eylül Cuma 10:00, , 13 Eylül Cumartesi 14:30, yarın öğlen`;

    expect(parseProposedSlotsFromMessage(message)).toEqual([
      { date: "", time: "10:00", label: "12 Eylül Cuma 10:00" },
      { date: "", time: "14:30", label: "13 Eylül Cumartesi 14:30" },
      { date: "", time: "", label: "yarın öğlen" },
    ]);
  });
});
