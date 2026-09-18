import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MeetingMentorNotesStrip } from "@/components/notes/meeting-mentor-notes-strip";
import { meetingFixture } from "@test/fixtures/startup-meetings";

const other = meetingFixture("finance", "2026-08-20T09:00:00Z", {
  agenda: "Financial Model & Sustainability",
});

describe("MeetingMentorNotesStrip", () => {
  it("scrolls other same-mentor notes as links to their notebooks", () => {
    render(
      <MeetingMentorNotesStrip
        meetings={[other]}
        mentorTitle="UX/UI Mentor"
        openTodos={new Map([["finance", 2]])}
      />,
    );

    const region = screen.getByRole("region", {
      name: "Aynı mentörle diğer toplantı notları",
    });
    const link = screen.getByRole("link", {
      name: /Financial Model & Sustainability/,
    });
    expect(link).toHaveAttribute("href", "/notes/finance");
    expect(region.className).not.toMatch(/grid/);
    expect(screen.getByText("Görevler tamamlanmadı")).toBeInTheDocument();
  });
});
