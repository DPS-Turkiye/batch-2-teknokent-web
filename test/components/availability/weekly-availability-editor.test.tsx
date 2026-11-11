import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import {
  useWeeklyAvailabilityForm,
  type WeeklyAvailabilitySource,
} from "@/hooks/use-weekly-availability-form";
import { Weekday, type MentorAvailabilitySettings } from "@/interfaces/mentor";

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

/** What the owner passes to the form hook. */
type SourceOptions = Pick<
  WeeklyAvailabilitySource,
  "numberFields" | "numberFieldLabels"
>;
type EditorProps = Omit<
  ComponentProps<typeof WeeklyAvailabilityEditor>,
  "editor"
>;

function Harness({
  source,
  editorProps,
}: {
  source: SourceOptions;
  editorProps: EditorProps;
}) {
  const editor = useWeeklyAvailabilityForm(
    {
      settings,
      loadFailed: false,
      save: vi.fn(),
      isSaving: false,
      ...source,
    },
    vi.fn(),
  );
  return <WeeklyAvailabilityEditor editor={editor} {...editorProps} />;
}

function renderEditor(
  source: SourceOptions = {},
  editorProps: EditorProps = {},
) {
  return render(<Harness source={source} editorProps={editorProps} />);
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
    renderEditor(
      { numberFields: ["defaultMeetingDurationMinutes"] },
      { showUnavailableDates: false },
    );
    expect(screen.getByText("Varsayılan görüşme süresi")).toBeInTheDocument();
    expect(screen.queryByText("Eş zamanlı mentorluk limiti")).toBeNull();
    expect(screen.queryByText("İki görüşme arası tampon")).toBeNull();
    expect(screen.queryByText("UYGUN OLMADIĞIN TARİHLER")).toBeNull();
  });

  it("uses the owner's own name for a number field", () => {
    renderEditor({
      numberFieldLabels: { menteeCapacity: "Eş zamanlı öğrenci limiti" },
    });
    expect(screen.getByText("Eş zamanlı öğrenci limiti")).toBeInTheDocument();
    expect(screen.queryByText("Eş zamanlı mentorluk limiti")).toBeNull();
    expect(screen.getByText("Varsayılan görüşme süresi")).toBeInTheDocument();
  });

  it("drops the defaults section when an owner has no number fields", () => {
    renderEditor({ numberFields: [] });
    expect(screen.queryByText("KAPASİTE VE VARSAYILANLAR")).toBeNull();
  });
});
