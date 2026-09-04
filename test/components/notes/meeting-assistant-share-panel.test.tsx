import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MeetingAssistantSharePanel } from "@/components/notes/meeting-assistant-share-panel";
import { useAssistantShare } from "@/hooks/use-meeting-notes";

vi.mock("@/hooks/use-meeting-notes", () => ({
  useAssistantShare: vi.fn(),
}));

describe("MeetingAssistantSharePanel", () => {
  it("renders the published transcript as read-only text", () => {
    vi.mocked(useAssistantShare).mockReturnValue({
      data: {
        meetingId: "meeting-1",
        transcript: [
          {
            id: "s1",
            speaker: "Ayşe",
            text: "Düzenlenmiş merhaba",
            at: "00:10",
          },
        ],
        transcriptPublishedAt: "2026-09-01T10:00:00Z",
        report: null,
        reportPublishedAt: null,
      },
      isLoading: false,
    } as never);

    render(<MeetingAssistantSharePanel meetingId="meeting-1" />);

    expect(screen.getByText("Düzenlenmiş merhaba")).toBeInTheDocument();
    expect(screen.getByText(/salt okunur/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
