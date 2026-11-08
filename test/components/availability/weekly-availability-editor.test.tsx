import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { ToastProvider } from "@/components/providers/toast-provider";
import { useWeeklyAvailabilityForm } from "@/hooks/use-weekly-availability-form";
import { type MentorAvailabilitySettings, Weekday } from "@/interfaces/mentor";
import type { AvailabilityNumberField } from "@/lib/mentor-availability";

const settings: MentorAvailabilitySettings = {
  rules: [
    {
      id: "rule-1",
      dayOfWeek: Weekday.Thursday,
      startTime: "10:00:00",
      endTime: "12:00:00",
      slotMinutes: 20,
    },
  ],
  exceptions: [],
  menteeCapacity: null,
  defaultMeetingDurationMinutes: 20,
  meetingBufferMinutes: 0,
};

type EditorOptions = {
  numberFields?: readonly AvailabilityNumberField[];
  showUnavailableDates?: boolean;
};

function Harness({ numberFields, showUnavailableDates }: EditorOptions) {
  const editor = useWeeklyAvailabilityForm(
    {
      settings,
      loadFailed: false,
      save: vi.fn(),
      isSaving: false,
      numberFields,
    },
    vi.fn(),
  );
  return (
    <WeeklyAvailabilityEditor
      editor={editor}
      showUnavailableDates={showUnavailableDates}
    />
  );
}

function renderEditor(options: EditorOptions = {}) {
  return render(
    <ToastProvider>
      <Harness {...options} />
    </ToastProvider>,
  );
}

describe("WeeklyAvailabilityEditor", () => {
  it("shows the week, every number field and unavailable dates by default", () => {
    renderEditor();
    expect(screen.getByText("HAFTALIK UYGUNLUK")).toBeInTheDocument();
    expect(screen.getByLabelText("Perşembe 1. aralık başlangıç")).toHaveValue(
      "10:00",
    );
    expect(screen.getByText("Eş zamanlı mentorluk limiti")).toBeInTheDocument();
    expect(screen.getByText("Varsayılan görüşme süresi")).toBeInTheDocument();
    expect(screen.getByText("İki görüşme arası tampon")).toBeInTheDocument();
    expect(screen.getByText("UYGUN OLMADIĞIN TARİHLER")).toBeInTheDocument();
  });

  it("shows only the parts an owner uses", () => {
    renderEditor({
      numberFields: ["defaultMeetingDurationMinutes"],
      showUnavailableDates: false,
    });
    expect(screen.getByText("Varsayılan görüşme süresi")).toBeInTheDocument();
    expect(screen.queryByText("Eş zamanlı mentorluk limiti")).toBeNull();
    expect(screen.queryByText("İki görüşme arası tampon")).toBeNull();
    expect(screen.queryByText("UYGUN OLMADIĞIN TARİHLER")).toBeNull();
  });

  it("drops the defaults section when an owner has no number fields", () => {
    renderEditor({ numberFields: [] });
    expect(screen.queryByText("KAPASİTE VE VARSAYILANLAR")).toBeNull();
  });
});
