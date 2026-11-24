import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MentorRequestStartupDetail } from "@/components/mentorships/mentor-request-startup-detail";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { MentorReviewMode } from "@/types/mentorship";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";
import { freezeDate, InLocale, renderWithQueryClient } from "@test/test-utils";

const decide = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/mentorships/document-request-checklist", () => ({
  DocumentRequestChecklist: () => null,
}));
vi.mock("@/hooks/use-member-profile-links", () => ({
  useMemberProfileLinks: () => () => true,
}));
vi.mock("@/hooks/use-startup-documents", () => ({
  useOpenDocument: () => vi.fn(),
}));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorRequestDecision: () => ({ mutateAsync: decide, isPending: false }),
  useMentorshipRequest: () => ({
    // No organization, so the team's profile, members and files are not fetched.
    data: menteeRequestFixture({
      programName: "QA Recorded Program",
      id: "req-1",
      mentorId: "mentor-1",
      requesterId: "mentee-1",
      requesterName: "Gülse Buran",
      organizationId: "",
      organizationName: "Döngü",
      supportArea: "Ürün",
      summary: "MVP önceliklerini netleştirmek",
      requesterMessage: "",
      status: MentorshipRequestStatus.Pending,
      createdAt: "2026-10-01T09:00:00Z",
    }),
    isLoading: false,
    error: null,
  }),
}));

describe("MentorRequestStartupDetail", () => {
  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <MentorRequestStartupDetail requestId="req-1" />
      </InLocale>,
    );

    expect(
      screen.getByRole("button", { name: "Accept mentorship" }),
    ).toBeInTheDocument();
    expect(screen.getByText("New request")).toBeInTheDocument();
    expect(screen.getByText("About the startup")).toBeInTheDocument();
    expect(screen.getByText("Team members")).toBeInTheDocument();
  });

  it("shows the startup in the mentor's blue accent", () => {
    renderWithQueryClient(<MentorRequestStartupDetail requestId="req-1" />);

    const accept = screen.getByRole("button", { name: "Mentorluğu kabul et" });
    const themed = accept.closest<HTMLElement>('[style*="--ms-accent"]');
    expect(themed?.style.getPropertyValue("--ms-accent")).toBe("#26a4ff");
  });
});

it("shows the program captured on the request in its program field", () => {
  renderWithQueryClient(<MentorRequestStartupDetail requestId="req-1" />);
  expect(screen.getByText("QA Recorded Program")).toBeInTheDocument();
});

describe("MentorRequestStartupDetail opened to propose times", () => {
  afterEach(() => {
    vi.useRealTimers();
    decide.mockReset();
  });

  it("opens the review on the propose form when linked from the mentor home", () => {
    renderWithQueryClient(
      <MentorRequestStartupDetail
        requestId="req-1"
        initialReview={MentorReviewMode.Propose}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mentee saatlerine dön" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Önerileri gönder" }),
    ).toBeDisabled();
  });

  it("still sends a counter-proposal with the mentor's own time", async () => {
    freezeDate("2026-11-18T09:00:00");
    decide.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithQueryClient(
      <MentorRequestStartupDetail
        requestId="req-1"
        initialReview={MentorReviewMode.Propose}
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "1. öneri günü" }),
      "2026-11-20",
    );
    fireEvent.change(screen.getByLabelText("1. öneri saati"), {
      target: { value: "14:00" },
    });
    await user.click(screen.getByRole("button", { name: "Önerileri gönder" }));

    expect(decide).toHaveBeenCalledWith({
      id: "req-1",
      status: MentorshipRequestStatus.CounterProposed,
      message:
        "Görüşme için aşağıdaki saatleri öneriyorum. Sizin için uygun olan birinde görüşebiliriz.\nMentörün önerdiği saatler: 20 Kasım Cuma · 14:00\nproposedSlots:2026-11-20T14:00",
      requestedDocuments: [],
    });
  });
});

it("declines with a polite message", async () => {
  decide.mockReset();
  decide.mockResolvedValue({});
  const user = userEvent.setup();
  renderWithQueryClient(<MentorRequestStartupDetail requestId="req-1" />);

  await user.click(screen.getByRole("button", { name: "Reddet" }));

  expect(decide).toHaveBeenCalledWith({
    id: "req-1",
    status: MentorshipRequestStatus.Declined,
    message: "Talebiniz için teşekkür ederim; maalesef şu an uygun değilim.",
  });
});
