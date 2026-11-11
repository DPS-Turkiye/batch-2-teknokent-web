import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MeetingAssistantSharePanel } from "@/components/notes/meeting-assistant-share-panel";
import { useAssistantShare } from "@/hooks/use-meeting-notes";
import type { MeetingAssistantShare } from "@/interfaces/meeting-note";
import { successQuery } from "@test/mocks/query-results";

vi.mock("@/hooks/use-meeting-notes", () => ({
  useAssistantShare: vi.fn(),
}));

function share(overrides: Partial<MeetingAssistantShare> = {}) {
  vi.mocked(useAssistantShare).mockReturnValue(
    successQuery<MeetingAssistantShare>({
      meetingId: "meeting-1",
      transcript: null,
      transcriptPublishedAt: null,
      report: null,
      reportPublishedAt: null,
      ...overrides,
    }),
  );
}

describe("MeetingAssistantSharePanel", () => {
  it("shows transcript and report as separate folds, filling in what the mentor sent", () => {
    share({
      transcript: [
        {
          id: "s1",
          speaker: "Ayşe",
          text: "Düzenlenmiş merhaba",
          at: "00:10",
        },
      ],
      transcriptPublishedAt: "2026-09-01T10:00:00Z",
      report: {
        title: "MVP özeti",
        topic: "Kapsam",
        meetingDate: "2026-08-18",
        summary: "Kapsamı daraltmaya karar verildi.",
        topicsDiscussed: [],
        decisions: [],
        actionItems: [],
        risksOrBlockers: [],
        nextSteps: [],
        model: "test",
      },
      reportPublishedAt: "2026-09-01T10:05:00Z",
    });

    render(<MeetingAssistantSharePanel meetingId="meeting-1" />);

    expect(screen.getByText("Toplantı Transkripti")).toBeInTheDocument();
    expect(screen.getByText("Toplantı Raporu")).toBeInTheDocument();
    expect(screen.getByText("Düzenlenmiş merhaba")).toBeInTheDocument();
    expect(screen.queryByText("00:10")).not.toBeInTheDocument();
    expect(
      screen.getByText("Kapsamı daraltmaya karar verildi."),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/salt okunur/)).toHaveLength(2);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps empty folds until the mentor sends each piece", () => {
    share();
    render(<MeetingAssistantSharePanel meetingId="meeting-1" />);

    expect(
      screen.getByText("Mentör henüz transkript göndermedi."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mentör henüz rapor göndermedi."),
    ).toBeInTheDocument();
  });
});
