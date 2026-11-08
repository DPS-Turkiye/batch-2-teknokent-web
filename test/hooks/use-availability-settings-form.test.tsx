import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { useAvailabilitySettingsForm } from "@/hooks/use-mentor-profile";
import { type MentorAvailabilitySettings, Weekday } from "@/interfaces/mentor";
import {
  getAvailabilitySettings,
  updateAvailabilitySettings,
} from "@/lib/client/mentor-profile";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-profile", () => ({
  createAvailabilitySlot: vi.fn(),
  deleteAvailabilitySlot: vi.fn(),
  getMentorAvailability: vi.fn(),
  getMentorProfile: vi.fn(),
  updateMentorProfile: vi.fn(),
  getAvailabilitySettings: vi.fn(),
  updateAvailabilitySettings: vi.fn(),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <>
        {children}
        <Toaster />
      </>
    </QueryClientProvider>
  );
}

const settings: MentorAvailabilitySettings = {
  rules: [
    {
      id: "rule-1",
      dayOfWeek: Weekday.Tuesday,
      startTime: "10:00:00",
      endTime: "13:00:00",
      slotMinutes: 45,
    },
  ],
  exceptions: [],
  menteeCapacity: null,
  defaultMeetingDurationMinutes: 45,
  meetingBufferMinutes: 15,
};

async function renderLoaded(onSaved = vi.fn()) {
  const rendered = renderHook(() => useAvailabilitySettingsForm(onSaved), {
    wrapper: Wrapper,
  });
  await waitFor(() => expect(rendered.result.current.draft).not.toBeNull());
  return rendered;
}

function tuesdayRanges(
  result: Awaited<ReturnType<typeof renderLoaded>>["result"],
) {
  return result.current.days.find((day) => day.day === Weekday.Tuesday)!.ranges;
}

describe("useAvailabilitySettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAvailabilitySettings).mockResolvedValue(settings);
    vi.mocked(updateAvailabilitySettings).mockResolvedValue(settings);
  });

  it("adds a second range on a day and saves both", async () => {
    const onSaved = vi.fn();
    const { result } = await renderLoaded(onSaved);
    expect(tuesdayRanges(result)).toHaveLength(1);

    act(() => result.current.addRange(Weekday.Tuesday));
    expect(tuesdayRanges(result)).toHaveLength(2);
    await act(async () => {
      await result.current.save();
    });

    expect(updateAvailabilitySettings).toHaveBeenCalledWith({
      rules: [
        {
          dayOfWeek: Weekday.Tuesday,
          startTime: "10:00",
          endTime: "13:00",
          slotMinutes: 45,
        },
        {
          dayOfWeek: Weekday.Tuesday,
          startTime: "13:00",
          endTime: "14:00",
          slotMinutes: 45,
        },
      ],
      exceptions: [],
      menteeCapacity: null,
      defaultMeetingDurationMinutes: 45,
      meetingBufferMinutes: 15,
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it("does not send overlapping ranges", async () => {
    const onSaved = vi.fn();
    const { result } = await renderLoaded(onSaved);

    act(() => result.current.addRange(Weekday.Tuesday));
    const added = tuesdayRanges(result)[1];
    act(() => result.current.updateRange(added.key, "startTime", "12:00"));
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBe("Salı: saat aralıkları çakışıyor.");
    expect(updateAvailabilitySettings).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("keeps the editor open with the reason when the save fails", async () => {
    vi.mocked(updateAvailabilitySettings).mockRejectedValue(
      new Error("Weekly availability ranges cannot overlap"),
    );
    const onSaved = vi.fn();
    const { result } = await renderLoaded(onSaved);

    act(() => result.current.addRange(Weekday.Tuesday));
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBe(
      "Weekly availability ranges cannot overlap",
    );
    expect(tuesdayRanges(result)).toHaveLength(2);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("does not let a saved capacity be emptied", async () => {
    vi.mocked(getAvailabilitySettings).mockResolvedValue({
      ...settings,
      menteeCapacity: 4,
    });
    const { result } = await renderLoaded();

    act(() => result.current.setNumber("menteeCapacity", ""));
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.error).toBe(
      "Eş zamanlı mentorluk limiti 1 ile 50 arasında olmalı.",
    );
    expect(updateAvailabilitySettings).not.toHaveBeenCalled();
  });

  it("reports settings that could not be loaded", async () => {
    vi.mocked(getAvailabilitySettings).mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useAvailabilitySettingsForm(vi.fn()), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current.loadError).toBe("Müsaitlik ayarları yüklenemedi."),
    );
    expect(result.current.draft).toBeNull();
  });

  it("adds an unavailable day once and refuses it a second time", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.setExceptionField("startsOn", "2026-10-01"));
    act(() => result.current.addException());
    act(() => result.current.setExceptionField("startsOn", "2026-10-01"));
    act(() => result.current.addException());

    expect(result.current.draft?.exceptions).toEqual([
      { startsOn: "2026-10-01", endsOn: "2026-10-01", reason: null },
    ]);
    expect(result.current.error).toBe("Bu tarih aralığı zaten ekli.");
  });

  it("closes a day and reopens it with a default range", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.toggleDay(Weekday.Tuesday));
    expect(tuesdayRanges(result)).toHaveLength(0);
    act(() => result.current.toggleDay(Weekday.Tuesday));

    expect(tuesdayRanges(result)).toMatchObject([
      { startTime: "09:00", endTime: "17:00" },
    ]);
  });

  it("steps the capacity and defaults within their bounds", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.stepNumber("defaultMeetingDurationMinutes", 1));
    act(() => result.current.stepNumber("meetingBufferMinutes", -1));
    act(() => result.current.stepNumber("menteeCapacity", 1));

    expect(result.current.draft).toMatchObject({
      defaultMeetingDurationMinutes: "60",
      meetingBufferMinutes: "10",
      menteeCapacity: "1",
    });
  });

  it("opens the date form and closes it once a date is added", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.openExceptionForm());
    expect(result.current.isAddingException).toBe(true);
    act(() => result.current.setExceptionField("startsOn", "2026-10-05"));
    act(() => result.current.addException());

    expect(result.current.isAddingException).toBe(false);
    expect(result.current.draft?.exceptions).toHaveLength(1);
  });
});
