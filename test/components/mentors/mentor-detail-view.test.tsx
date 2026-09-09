import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorDetailView } from "@/components/mentors/mentor-detail-view";
import { UserRole } from "@/interfaces/session";
import { submitMentorshipRequest } from "@/lib/mentorship-requests";
import { mentorProfile } from "@test/fixtures/mentors";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

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

describe("MentorDetailView", () => {
  it("opens the Figma mentorship request dialog from the profile CTA", async () => {
    const user = userEvent.setup();
    const slotDate = new Date();
    slotDate.setDate(slotDate.getDate() + 1);
    slotDate.setHours(10, 0, 0, 0);
    renderWithQueryClient(
      <MentorDetailView
        mentor={mentorProfile}
        slots={[
          {
            id: "slot-1",
            startsAt: slotDate.toISOString(),
            durationMinutes: 45,
            booked: false,
          },
        ]}
        startup={startup}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Dr. Kemal Arslan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bu mentor neden sana önerildi?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Uygunluk")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Kemal ile çalışmak ister misin?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mentorluk talebi gönder" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Mentorluk talebi oluştur"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Mentörlere dön")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Mentorluk talebi gönder" }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Dr. Kemal Arslan ile mentorluk planla",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nerede takıldık?")).toBeInTheDocument();
    expect(screen.getByLabelText("1. tercih saati")).toBeInTheDocument();
    expect(submitMentorshipRequest).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
