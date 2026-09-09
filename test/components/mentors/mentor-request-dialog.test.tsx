import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorRequestDialog } from "@/components/mentors/mentor-request-dialog";
import { UserRole } from "@/interfaces/session";
import { submitMentorshipRequest } from "@/lib/mentorship-requests";
import { mentorProfile } from "@test/fixtures/mentors";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({
    userId: "user-1",
    email: "sudenaz@example.com",
    fullName: "Sudenaz Yılmaz",
    jobTitle: "Mentee",
    role: UserRole.Mentee,
    organizationId: "org-1",
    organizationName: "Team TNT",
  }),
}));

vi.mock("@/lib/mentorship-requests", () => ({
  submitMentorshipRequest: vi.fn(),
}));

const startup = {
  organizationId: "org-1",
  name: "Team TNT",
  summary: "SaaS",
  sector: "",
  stage: "",
  technologies: [],
  confirmedProfile: false,
};

function renderDialog() {
  const onClose = vi.fn();
  const onSent = vi.fn();
  renderWithQueryClient(
    <MentorRequestDialog
      mentor={mentorProfile}
      slots={[]}
      startup={startup}
      onClose={onClose}
      onSent={onSent}
    />,
  );
  return { onClose, onSent };
}

describe("MentorRequestDialog", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(submitMentorshipRequest).mockReset();
  });

  it("keeps Talebi gönder disabled until three half-hour times are entered", () => {
    renderDialog();

    const send = screen.getByRole("button", { name: "Talebi gönder" });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByLabelText("1. tercih saati"), {
      target: { value: "10:15" },
    });
    fireEvent.change(screen.getByLabelText("2. tercih saati"), {
      target: { value: "10:30" },
    });
    fireEvent.change(screen.getByLabelText("3. tercih saati"), {
      target: { value: "14:00" },
    });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByLabelText("1. tercih saati"), {
      target: { value: "10:00" },
    });
    expect(send).toBeEnabled();
  });

  it("sends the request with the three preferred times", async () => {
    vi.mocked(submitMentorshipRequest).mockResolvedValue({
      id: "req-1",
      status: "PENDING",
    });
    const user = userEvent.setup();
    const { onSent } = renderDialog();

    fireEvent.change(screen.getByLabelText("1. tercih saati"), {
      target: { value: "10:00" },
    });
    fireEvent.change(screen.getByLabelText("2. tercih saati"), {
      target: { value: "10:30" },
    });
    fireEvent.change(screen.getByLabelText("3. tercih saati"), {
      target: { value: "14:00" },
    });

    await user.click(screen.getByRole("button", { name: "Talebi gönder" }));

    expect(submitMentorshipRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorId: mentorProfile.id,
        requesterMessage: expect.stringContaining(
          "Tercih edilen saatler: 10:00, 10:30, 14:00",
        ),
      }),
    );
    expect(onSent).toHaveBeenCalledWith("req-1");
  });
});
