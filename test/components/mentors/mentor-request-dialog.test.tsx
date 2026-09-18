import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorRequestDialog } from "@/components/mentors/mentor-request-dialog";
import { UserRole } from "@/interfaces/session";
import { upcomingPreferenceDays } from "@/lib/mentor-availability-days";
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

function fillPreference(index: number, date: string, time: string) {
  fireEvent.change(screen.getByLabelText(`${index}. tercih günü`), {
    target: { value: date },
  });
  fireEvent.change(screen.getByLabelText(`${index}. tercih saati`), {
    target: { value: time },
  });
}

describe("MentorRequestDialog", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(submitMentorshipRequest).mockReset();
  });

  it("keeps Talebi gönder disabled until at least one valid preference is entered", () => {
    renderDialog();
    const days = upcomingPreferenceDays();
    const first = days[0]?.value ?? "";

    const send = screen.getByRole("button", { name: "Talebi gönder" });
    expect(send).toBeDisabled();
    expect(screen.getByLabelText("1. tercih günü")).toBeInTheDocument();

    fillPreference(1, first, "10:15");
    expect(send).toBeDisabled();

    fillPreference(1, first, "10:00");
    expect(send).toBeEnabled();
  });

  it("sends the request with a single preferred day and time", async () => {
    vi.mocked(submitMentorshipRequest).mockResolvedValue({
      id: "req-1",
      status: "PENDING",
    });
    const user = userEvent.setup();
    const { onSent } = renderDialog();
    const days = upcomingPreferenceDays();
    const first = days[0]?.value ?? "";

    fillPreference(1, first, "10:00");

    await user.click(screen.getByRole("button", { name: "Talebi gönder" }));

    expect(submitMentorshipRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorId: mentorProfile.id,
        requesterMessage: expect.stringMatching(
          /Tercih edilen saatler: .+ · 10:00/,
        ),
      }),
    );
    expect(onSent).toHaveBeenCalledWith("req-1");
  });

  it("asks where they are stuck when a title-less mentor leaves nothing to fall back on", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <MentorRequestDialog
        mentor={{
          ...mentorProfile,
          professionalTitle: "",
          recommendationReasons: [],
        }}
        slots={[]}
        startup={startup}
        onClose={vi.fn()}
        onSent={vi.fn()}
      />,
    );

    fillPreference(1, upcomingPreferenceDays()[0]?.value ?? "", "10:00");
    await user.click(screen.getByRole("button", { name: "Talebi gönder" }));

    expect(
      screen.getByText("Nerede takıldığını kısaca yaz."),
    ).toBeInTheDocument();
    expect(submitMentorshipRequest).not.toHaveBeenCalled();
  });

  it("sends the request with three preferred days and times", async () => {
    vi.mocked(submitMentorshipRequest).mockResolvedValue({
      id: "req-1",
      status: "PENDING",
    });
    const user = userEvent.setup();
    const { onSent } = renderDialog();
    const days = upcomingPreferenceDays();
    const first = days[0]?.value ?? "";
    const second = days[1]?.value ?? "";
    const third = days[2]?.value ?? "";

    fillPreference(1, first, "10:00");
    fillPreference(2, second, "10:30");
    fillPreference(3, third, "14:00");

    await user.click(screen.getByRole("button", { name: "Talebi gönder" }));

    expect(submitMentorshipRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorId: mentorProfile.id,
        requesterMessage: expect.stringMatching(
          /Tercih edilen saatler: .+ · 10:00, .+ · 10:30, .+ · 14:00/,
        ),
      }),
    );
    expect(onSent).toHaveBeenCalledWith("req-1");
  });
});
