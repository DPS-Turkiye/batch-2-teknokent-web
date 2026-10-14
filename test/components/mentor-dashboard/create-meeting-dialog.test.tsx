import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreateMeetingDialog } from "@/components/mentor-dashboard/create-meeting-dialog";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { InLocale } from "@test/test-utils";

const regular: RegularMentorship = {
  id: "reg-1",
  mentorId: "mentor-1",
  mentorName: "Nihan Öztürk",
  organizationId: "org-9",
  organizationName: "Orbit",
  status: "ACTIVE",
  startDate: "2026-09-01",
  endDate: null,
  daysPerWeek: 2,
  goals: null,
  goalItems: [],
  progressPercent: 0,
};

function dialog(regularMentorships: RegularMentorship[] = []) {
  return (
    <CreateMeetingDialog
      mentorName="Nihan Öztürk"
      mentorships={[]}
      programs={[]}
      regularMentorships={regularMentorships}
      startAt={null}
      isSaving={false}
      onClose={vi.fn()}
      onSubmit={vi.fn()}
    />
  );
}

describe("CreateMeetingDialog", () => {
  it("explains that a meeting needs someone to meet", () => {
    render(dialog());

    expect(
      screen.getByText(/kabul edilmiş bir mentorluk veya/),
    ).toBeInTheDocument();
  });

  it("reads in English, with the regular mentorship's rhythm", () => {
    render(<InLocale locale="en">{dialog([regular])}</InLocale>);

    expect(
      screen.getByRole("dialog", { name: "Create a meeting" }),
    ).toBeInTheDocument();
    expect(screen.getByText("My regular mentorships:")).toBeInTheDocument();
    expect(screen.getByText("2 days a week · Regular")).toBeInTheDocument();
    expect(screen.getByText("Next 7 days")).toBeInTheDocument();
    expect(
      screen.getByText("I want a transcript of this meeting"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });
});
