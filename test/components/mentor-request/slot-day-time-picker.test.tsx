import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SlotDayTimePicker } from "@/components/mentor-request/slot-day-time-picker";
import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import { slotDayLabel, slotTimeLabel } from "@/lib/mentor-availability-days";
import { InLocale } from "@test/test-utils";

function slot(
  id: string,
  startsAt: string,
  booked = false,
): MentorAvailabilitySlot {
  return { id, startsAt, durationMinutes: 45, booked };
}

const slots = [
  slot("thu-late", "2026-10-08T14:00:00"),
  slot("wed", "2026-10-07T10:00:00"),
  slot("thu-early", "2026-10-08T09:30:00"),
  slot("thu-booked", "2026-10-08T11:00:00", true),
];

describe("SlotDayTimePicker", () => {
  it("names the days and lengths in English", () => {
    render(
      <InLocale locale="en">
        <SlotDayTimePicker slots={slots} disabled={false} onPick={vi.fn()} />
      </InLocale>,
    );

    const days = within(screen.getByRole("group", { name: "Pick a day" }));
    expect(days.getByRole("button", { name: "7 Wed" })).toBeInTheDocument();
    expect(screen.getByText(/45 min/)).toBeInTheDocument();
  });

  it("shows a day row, then the chosen day's free times, and books the one picked", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(
      <SlotDayTimePicker slots={slots} disabled={false} onPick={onPick} />,
    );

    const days = within(screen.getByRole("group", { name: "Gün seç" }));
    expect(
      days.getAllByRole("button").map((button) => button.textContent),
    ).toEqual([
      slotDayLabel("2026-10-07T10:00:00"),
      slotDayLabel("2026-10-08T09:30:00"),
    ]);
    expect(screen.getAllByText(/dk/)).toHaveLength(1);

    await user.click(
      days.getByRole("button", { name: slotDayLabel("2026-10-08T09:30:00") }),
    );
    const times = screen
      .getAllByText(/dk/)
      .map((button) => button.textContent?.split(" ·")[0]);
    expect(times).toEqual([
      slotTimeLabel("2026-10-08T09:30:00"),
      slotTimeLabel("2026-10-08T14:00:00"),
    ]);

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(slotTimeLabel("2026-10-08T14:00:00")),
      }),
    );
    expect(onPick).toHaveBeenCalledWith("thu-late");
  });

  it("shows nothing when the mentor has no free slot", () => {
    const { container } = render(
      <SlotDayTimePicker
        slots={[slot("b", "2026-10-08T11:00:00", true)]}
        disabled={false}
        onPick={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
