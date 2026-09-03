import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingDetailDialog } from "@/components/mentor-dashboard/meeting-detail-dialog";
import { MeetingStatus } from "@/interfaces/meeting";
import { ProgramMentorInvitedBy, ProgramMentorStatus } from "@/interfaces/program";
import { getMeetingRoom } from "@/lib/client/meetings";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/meetings", () => ({
  getMeetingRoom: vi.fn(async () => []),
}));

const meeting = {
  id: "m1",
  organizationId: "org-1",
  organizationName: "Döngü",
  mentorId: "mentor-1",
  mentorName: "Leyla Aksoy",
  scheduledAt: "2026-08-26T08:00:00.000Z",
  durationMinutes: 60,
  agenda: "Mentor: Leyla",
  meetLink: "https://meet.google.com/abc-defg-hij",
  status: MeetingStatus.Scheduled,
};

const programs = [
  {
    id: "prog-1",
    name: "DPS",
    coordinatorId: "c1",
    coordinatorName: "Koordinator",
    createdAt: "2026-01-01T00:00:00.000Z",
    startups: [
      { id: "org-1", name: "Döngü" },
      { id: "org-2", name: "NovaMed" },
    ],
    mentors: [
      {
        mentorId: "mentor-1",
        fullName: "Leyla Aksoy",
        email: "a@example.com",
        status: ProgramMentorStatus.Accepted,
        invitedBy: ProgramMentorInvitedBy.Coordinator,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        mentorId: "mentor-2",
        fullName: "Ayşe Kaya",
        email: "b@example.com",
        status: ProgramMentorStatus.Accepted,
        invitedBy: ProgramMentorInvitedBy.Coordinator,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  },
];

describe("MeetingDetailDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMeetingRoom).mockResolvedValue([]);
  });

  it("adds a startup from the program that is not yet in the room", async () => {
    const onAddStartup = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithQueryClient(
      <MeetingDetailDialog
        meeting={meeting}
        programs={programs}
        onClose={() => undefined}
        onAddStartup={onAddStartup}
        onAddMentor={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Startup ekle"), "program:prog-1:org-2");
    await user.click(screen.getAllByRole("button", { name: "Ekle" })[0]);

    expect(onAddStartup).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-2", programId: "prog-1" }),
    );
  });

  it("asks before deleting the meeting", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderWithQueryClient(
      <MeetingDetailDialog
        meeting={meeting}
        onClose={() => undefined}
        onAddStartup={vi.fn()}
        onAddMentor={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Toplantıyı sil" }));
    expect(onDelete).toHaveBeenCalled();
  });
});
