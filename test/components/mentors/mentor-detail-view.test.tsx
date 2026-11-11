import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorDetailView } from "@/components/mentors/mentor-detail-view";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { submitMentorshipRequest } from "@/lib/mentorship-requests";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";
import { mentorProfile } from "@test/fixtures/mentors";
import { successQuery } from "@test/mocks/query-results";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

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

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
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
  it("reads in English", () => {
    vi.mocked(useMentorshipRequests).mockReturnValue(successQuery([]));
    renderWithQueryClient(
      <InLocale locale="en">
        <MentorDetailView mentor={mentorProfile} slots={[]} startup={startup} />
      </InLocale>,
    );

    expect(
      screen.getByText("Why was this mentor suggested to you?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No times to pick right now. You can still send a mentorship request.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send a mentorship request" }),
    ).toBeInTheDocument();
  });

  it("shows a student mentor's studies, and no such card for other mentors", () => {
    vi.mocked(useMentorshipRequests).mockReturnValue(successQuery([]));
    const { unmount } = renderWithQueryClient(
      <MentorDetailView
        mentor={{
          ...mentorProfile,
          studentProfile: {
            department: "Bilgisayar Mühendisliği",
            studyYear: "4. sınıf",
            strongCourses: ["CENG 140", "MATH 119"],
            projects: ["Kampüs etkinlik uygulaması"],
            erasmus: "TU Delft, 2025 güz",
          },
        }}
        slots={[]}
        startup={startup}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Öğrenim" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bilgisayar Mühendisliği")).toBeInTheDocument();
    expect(screen.getByText("CENG 140, MATH 119")).toBeInTheDocument();
    expect(screen.getByText("Kampüs etkinlik uygulaması")).toBeInTheDocument();
    expect(screen.getByText("TU Delft, 2025 güz")).toBeInTheDocument();
    unmount();

    renderWithQueryClient(
      <MentorDetailView mentor={mentorProfile} slots={[]} startup={startup} />,
    );
    expect(screen.queryByRole("heading", { name: "Öğrenim" })).toBeNull();
  });

  it("opens the Figma mentorship request dialog from the profile CTA", async () => {
    vi.mocked(useMentorshipRequests).mockReturnValue(successQuery([]));
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
    expect(screen.getByRole("button", { name: "Mesaj gönder" })).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Mentorluk talebi gönder" }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Dr. Kemal Arslan ile mentorluk planla",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nerede takıldık?")).toBeInTheDocument();
    expect(screen.getByLabelText("1. tercih günü")).toBeInTheDocument();
    expect(screen.getByLabelText("1. tercih saati")).toBeInTheDocument();
    expect(submitMentorshipRequest).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the accepted request conversation for the selected mentor", () => {
    vi.mocked(useMentorshipRequests).mockReturnValue(
      successQuery([
        menteeRequestFixture({
          id: "request-accepted",
          mentorId: mentorProfile.id,
          status: MentorshipRequestStatus.Accepted,
        }),
      ]),
    );

    renderWithQueryClient(
      <MentorDetailView mentor={mentorProfile} slots={[]} startup={startup} />,
    );

    expect(screen.getByRole("link", { name: "Mesaj gönder" })).toHaveAttribute(
      "href",
      "/mentor-request/status?request=request-accepted#messages",
    );
  });

  it("shows mentee load, stats, programs and past roles when the backend sends them", () => {
    vi.mocked(useMentorshipRequests).mockReturnValue(successQuery([]));

    renderWithQueryClient(
      <MentorDetailView
        mentor={{
          ...mentorProfile,
          menteeCapacity: 6,
          activeMenteeCount: 4,
          completedMentorshipCount: 28,
          programNames: ["METU Stars"],
          experiences: [
            {
              title: "Head of Product Design",
              organization: "Looply",
              period: "2022–2026",
              summary: "B2B SaaS",
            },
          ],
        }}
        slots={[]}
        startup={startup}
      />,
    );

    expect(screen.getByText("4 / 6")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("tamamlanan mentorluk")).toBeInTheDocument();
    expect(screen.getByText("Program · METU Stars")).toBeInTheDocument();
    expect(
      screen.getByText("Head of Product Design · Looply"),
    ).toBeInTheDocument();
    expect(screen.getByText("2022–2026 · B2B SaaS")).toBeInTheDocument();
    expect(screen.queryByText("Bu hafta müsait")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Eğitim" }),
    ).not.toBeInTheDocument();
  });

  it("lists the mentor's schools apart from the experience", () => {
    vi.mocked(useMentorshipRequests).mockReturnValue(successQuery([]));

    renderWithQueryClient(
      <MentorDetailView
        mentor={{
          ...mentorProfile,
          educations: [
            {
              school: "ODTÜ",
              degree: "Lisans, Bilgisayar Mühendisliği",
              period: "2022 – 2026",
            },
            { school: "TU Delft", degree: null, period: null },
          ],
        }}
        slots={[]}
        startup={startup}
      />,
    );

    expect(screen.getByRole("heading", { name: "Eğitim" })).toBeInTheDocument();
    expect(
      screen.getByText("ODTÜ · Lisans, Bilgisayar Mühendisliği · 2022 – 2026"),
    ).toBeInTheDocument();
    expect(screen.getByText("TU Delft")).toBeInTheDocument();
  });

  it("falls back to the title and availability when there are no stats", () => {
    vi.mocked(useMentorshipRequests).mockReturnValue(successQuery([]));

    renderWithQueryClient(
      <MentorDetailView mentor={mentorProfile} slots={[]} startup={startup} />,
    );

    expect(screen.getByText("Bu hafta müsait")).toBeInTheDocument();
    expect(screen.queryByText("tamamlanan mentorluk")).not.toBeInTheDocument();
    expect(
      screen.getAllByText("Ürün & Araştırma Direktörü · Trendyol"),
    ).not.toHaveLength(0);
  });
});
