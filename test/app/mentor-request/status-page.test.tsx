import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RequestStatusPage from "@/app/mentor-request/status/page";
import {
  useAcceptProposedSlot,
  useAlternativeMentors,
  useMentorAvailability,
  useMentorshipRequest,
  useMentorshipRequests,
  useReplyForm,
  useRequestFileUpload,
  useSlotBooking,
  useWithdrawMentorRequest,
} from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { logMentorshipMeeting } from "@/lib/client/mentor-requests";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
const { searchParams } = vi.hoisted(() => ({
  searchParams: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams.current,
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/mentorships/document-request-checklist", () => ({
  DocumentRequestChecklist: () => null,
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    session: {
      userId: "requester-1",
      email: "mentee@teknokent.demo",
      role: "MENTEE",
    },
  }),
  useAppSession: () => ({
    userId: "requester-1",
    email: "mentee@teknokent.demo",
    role: "MENTEE",
  }),
}));

vi.mock("@/lib/client/mentor-requests", () => ({
  logMentorshipMeeting: vi.fn(),
}));

vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
  useMentorshipRequest: vi.fn(),
  useMentorAvailability: vi.fn(),
  useAlternativeMentors: vi.fn(),
  useReplyForm: vi.fn(),
  useRequestFileUpload: vi.fn(),
  useSlotBooking: vi.fn(),
  useWithdrawMentorRequest: vi.fn(),
  useAcceptProposedSlot: vi.fn(),
}));

const requestFixture = {
  id: "request-1",
  requesterId: "requester-1",
  organizationId: "org-1",
  organizationName: "GreenLoop",
  mentorId: "mentor-1",
  mentorName: "Leyla Aksoy",
  supportArea: "İş modeli ve strateji",
  summary: "fs",
  requesterMessage: "sfs",
  status: MentorshipRequestStatus.MoreInfoRequested,
  mentorMessage: null,
  rejectionReason: null,
  createdAt: "2026-08-17T09:49:54.374504Z",
  messages: [],
  recommendationSnapshot: null,
};

describe("RequestStatusPage", () => {
  const setReply = vi.fn();
  const sendReply = vi.fn();
  const bookSlot = vi.fn();
  const mutateAsync = vi.fn();
  const uploadFile = vi.fn();
  const acceptProposal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.current = new URLSearchParams("request=request-1");
    vi.mocked(useMentorshipRequests).mockReturnValue({
      data: [requestFixture],
      error: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useMentorshipRequests>);
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: requestFixture,
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);
    vi.mocked(useMentorAvailability).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useMentorAvailability>);
    vi.mocked(useAlternativeMentors).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useAlternativeMentors>);
    vi.mocked(useReplyForm).mockReturnValue({
      reply: "",
      setReply,
      sendReply,
      isSending: false,
      error: null,
    } as unknown as ReturnType<typeof useReplyForm>);
    vi.mocked(useSlotBooking).mockReturnValue({
      scheduledSlotId: null,
      bookSlot,
      isBooking: false,
      error: null,
    } as unknown as ReturnType<typeof useSlotBooking>);
    vi.mocked(useWithdrawMentorRequest).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useWithdrawMentorRequest>);
    vi.mocked(useRequestFileUpload).mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      mutateAsync: uploadFile,
    } as unknown as ReturnType<typeof useRequestFileUpload>);
    vi.mocked(useAcceptProposedSlot).mockReturnValue({
      mutateAsync: acceptProposal,
      isPending: false,
    } as unknown as ReturnType<typeof useAcceptProposedSlot>);
  });

  it("shows request details and hides status filter chips", () => {
    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Talep bilgileri")).toBeInTheDocument();
    expect(screen.getByText("Nerede takıldık?")).toBeInTheDocument();
    expect(screen.getByText("fs")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kabul Edildi" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Yanıt Bekleniyor" }),
    ).not.toBeInTheDocument();
  });

  it("shows the mentor's question and lets the mentee type a reply", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.type(
      screen.getByPlaceholderText("Yanıtınızı yazın…"),
      "Merhaba",
    );
    expect(setReply).toHaveBeenCalled();
  });

  it("sends the reply once the field has content", async () => {
    vi.mocked(useReplyForm).mockReturnValue({
      reply: "Merhaba",
      setReply,
      sendReply,
      isSending: false,
      error: null,
    } as unknown as ReturnType<typeof useReplyForm>);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.click(screen.getByText("Yanıtı Gönder"));
    expect(sendReply).toHaveBeenCalled();
  });

  it("books a real availability slot when accepted", async () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: { ...requestFixture, status: MentorshipRequestStatus.Accepted },
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);
    vi.mocked(useMentorAvailability).mockReturnValue({
      data: [
        {
          id: "slot-1",
          startsAt: "2026-08-26T08:00:00.000Z",
          durationMinutes: 60,
          booked: false,
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useMentorAvailability>);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.click(screen.getByText(/dk/));
    expect(bookSlot).toHaveBeenCalledWith("slot-1");
  });

  it("shows the already-scheduled state instead of the slot picker", () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: { ...requestFixture, status: MentorshipRequestStatus.Accepted },
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);
    vi.mocked(useSlotBooking).mockReturnValue({
      scheduledSlotId: "slot-1",
      bookSlot,
      isBooking: false,
      error: null,
    } as unknown as ReturnType<typeof useSlotBooking>);

    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Toplantı planlandı")).toBeInTheDocument();
  });

  it("shows the mentor conversation thread when accepted", async () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: { ...requestFixture, status: MentorshipRequestStatus.Accepted },
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Mentor ile mesajlaş")).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText("Mesajınızı yazın..."),
      "Merhaba",
    );
    expect(setReply).toHaveBeenCalled();
  });

  it("uploads a mentorship file from the accepted conversation", async () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: { ...requestFixture, status: MentorshipRequestStatus.Accepted },
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);
    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    const file = new File(["content"], "financial-model.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText("Mentorluk dosyası yükle"), file);

    expect(uploadFile).toHaveBeenCalledWith(file);
  });

  it("shows alternative mentors when declined", () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: {
        ...requestFixture,
        status: MentorshipRequestStatus.Declined,
        rejectionReason: "Uygun zaman yok",
      },
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);
    vi.mocked(useAlternativeMentors).mockReturnValue({
      data: [
        {
          id: "mentor-2",
          initials: "AK",
          fullName: "Aslıhan Koç",
          professionalTitle: "Program Danışmanı",
          company: "Teknokent",
        },
      ],
    } as unknown as ReturnType<typeof useAlternativeMentors>);

    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Uygun zaman yok")).toBeInTheDocument();
    expect(screen.getByText("Aslıhan Koç")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profili gör" })).toHaveAttribute(
      "href",
      "/mentors/mentor-2",
    );
    expect(screen.queryByText("Bu Mentoru Seç")).not.toBeInTheDocument();
  });

  it("withdraws a pending request", async () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: { ...requestFixture, status: MentorshipRequestStatus.Pending },
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.click(screen.getByText("Talebi Geri Çek"));
    expect(mutateAsync).toHaveBeenCalled();
  });

  it("lets the mentee accept a mentor-proposed time", async () => {
    acceptProposal.mockResolvedValue({
      ...requestFixture,
      status: MentorshipRequestStatus.Accepted,
    });
    vi.mocked(logMentorshipMeeting).mockResolvedValue({
      id: "meeting-1",
    } as never);
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: {
        ...requestFixture,
        status: MentorshipRequestStatus.CounterProposed,
        mentorMessage:
          "Mentörün önerdiği saatler: 12 Eylül Cumartesi · 15:00\nproposedSlots:2026-09-12T15:00",
      },
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    expect(
      screen.getByText("Mentör tarafından şu saatler önerildi"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "12 Eylül Cumartesi · 15:00" }),
    );
    await user.click(screen.getByRole("button", { name: "Saati kabul et" }));

    expect(acceptProposal).toHaveBeenCalledWith("2026-09-12T15:00");
    expect(logMentorshipMeeting).toHaveBeenCalledWith(
      "request-1",
      expect.objectContaining({
        mentorId: "mentor-1",
        durationMinutes: 45,
      }),
    );
    expect(push).toHaveBeenCalledWith("/mentorships");
  });

  it("asks the mentee to pick a request when the link names none", () => {
    searchParams.current = new URLSearchParams();
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: undefined,
      error: null,
    } as unknown as ReturnType<typeof useMentorshipRequest>);

    renderWithQueryClient(<RequestStatusPage />);

    expect(
      screen.getByText("Görüntülenecek bir talep seçilmedi."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Talep bilgileri")).not.toBeInTheDocument();
    expect(screen.queryByText("Talep yükleniyor…")).not.toBeInTheDocument();
  });

  it("opens the request named in the id query from Mentorluklarım", () => {
    searchParams.current = new URLSearchParams("id=request-1");
    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Talep bilgileri")).toBeInTheDocument();
    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
  });

  it("still finds the request a status link was sent to open", () => {
    searchParams.current = new URLSearchParams(
      `state=${MentorshipRequestStatus.Accepted}`,
    );
    vi.mocked(useMentorshipRequests).mockReturnValue({
      data: [{ ...requestFixture, status: MentorshipRequestStatus.Accepted }],
      error: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useMentorshipRequests>);

    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Talep bilgileri")).toBeInTheDocument();
    expect(
      screen.queryByText("Görüntülenecek bir talep seçilmedi."),
    ).not.toBeInTheDocument();
  });
});
