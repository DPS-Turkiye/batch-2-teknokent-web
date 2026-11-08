import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import {
  useWeeklyAvailabilityForm,
  type WeeklyAvailabilitySource,
} from "@/hooks/use-weekly-availability-form";
import { type MentorAvailabilitySettings, Weekday } from "@/interfaces/mentor";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

const settings: MentorAvailabilitySettings = {
  rules: [
    {
      id: "rule-1",
      dayOfWeek: Weekday.Wednesday,
      startTime: "14:00:00",
      endTime: "16:00:00",
      slotMinutes: 30,
    },
  ],
  exceptions: [],
  menteeCapacity: 3,
  defaultMeetingDurationMinutes: 30,
  meetingBufferMinutes: 0,
};

function source(
  overrides: Partial<WeeklyAvailabilitySource> = {},
): WeeklyAvailabilitySource {
  return {
    settings,
    loadFailed: false,
    save: vi.fn().mockResolvedValue(undefined),
    isSaving: false,
    ...overrides,
  };
}

describe("useWeeklyAvailabilityForm", () => {
  it("saves through whichever owner supplied the settings", async () => {
    const owner = source();
    const onSaved = vi.fn();
    const { result } = renderHook(
      () => useWeeklyAvailabilityForm(owner, onSaved),
      { wrapper: Wrapper },
    );

    act(() => result.current.toggleDay(Weekday.Friday));
    await act(async () => {
      await result.current.save();
    });

    expect(owner.save).toHaveBeenCalledWith({
      rules: [
        {
          dayOfWeek: Weekday.Wednesday,
          startTime: "14:00",
          endTime: "16:00",
          slotMinutes: 30,
        },
        {
          dayOfWeek: Weekday.Friday,
          startTime: "09:00",
          endTime: "17:00",
          slotMinutes: 30,
        },
      ],
      exceptions: [],
      menteeCapacity: 3,
      defaultMeetingDurationMinutes: 30,
      meetingBufferMinutes: 0,
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it("waits for the settings and says so when they could not load", () => {
    const { result, rerender } = renderHook(
      ({ owner }) => useWeeklyAvailabilityForm(owner, vi.fn()),
      {
        wrapper: Wrapper,
        initialProps: { owner: source({ settings: undefined }) },
      },
    );
    expect(result.current.draft).toBeNull();
    expect(result.current.loadError).toBeNull();

    rerender({ owner: source({ settings: undefined, loadFailed: true }) });
    expect(result.current.loadError).toBe("Müsaitlik ayarları yüklenemedi.");
  });

  it("keeps the edits and shows the reason when the owner's save fails", async () => {
    const owner = source({
      save: vi.fn().mockRejectedValue(new Error("Kapalı")),
    });
    const onSaved = vi.fn();
    const { result } = renderHook(
      () => useWeeklyAvailabilityForm(owner, onSaved),
      { wrapper: Wrapper },
    );

    act(() => result.current.toggleDay(Weekday.Monday));
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBe("Kapalı");
    expect(
      result.current.days.find((day) => day.day === Weekday.Monday)!.ranges,
    ).toHaveLength(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("checks only the number fields the owner uses", async () => {
    // A saved buffer the backend would refuse; an owner without a buffer never sees it.
    const owner = source({
      settings: { ...settings, meetingBufferMinutes: 999 },
      numberFields: ["defaultMeetingDurationMinutes"],
    });
    const { result } = renderHook(
      () => useWeeklyAvailabilityForm(owner, vi.fn()),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBeNull();
    expect(owner.save).toHaveBeenCalledWith(
      expect.objectContaining({ meetingBufferMinutes: 999, menteeCapacity: 3 }),
    );
  });

  it("still checks every field for an owner that lists none", async () => {
    const owner = source({
      settings: { ...settings, meetingBufferMinutes: 999 },
    });
    const { result } = renderHook(
      () => useWeeklyAvailabilityForm(owner, vi.fn()),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).not.toBeNull();
    expect(owner.save).not.toHaveBeenCalled();
  });
});
