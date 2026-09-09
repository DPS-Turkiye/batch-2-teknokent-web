import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RequestStatusPage from "@/app/mentor-request/status/page";
import {
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
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    session: { userId: "requester-1", email: "mentee@teknokent.demo" },
  }),
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
}));

const requestFixture = {
  id: "request-1",
  requesterId: "requester-1",
  organizationId: "org-1",
  organizationName: "GreenLoop",
  mentorId: "mentor-1",
  mentorName: "Leyla Aksoy",
  supportArea: "İş modeli ve strateji",
  status: MentorshipRequestStatus.MoreInfoRequested,
  mentorMessage: null,
  rejectionReason: null,
  createdAt: "2026-08-17T09:49:54.374504Z",
  messages: [],
};

describe("RequestStatusPage", () => {
  const setReply = vi.fn();
  const sendReply = vi.fn();
  const bookSlot = vi.fn();
  const mutateAsync = vi.fn();
  const uploadFile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMentorshipRequests).mockReturnValue({
      data: [requestFixture],
      error: null,
    } as ReturnType<typeof useMentorshipRequests>);
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: requestFixture,
      error: null,
    } as ReturnType<typeof useMentorshipRequest>);
    vi.mocked(useMentorAvailability).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMentorAvailability>);
    vi.mocked(useAlternativeMentors).mockReturnValue({
      data: [],
    } as ReturnType<typeof useAlternativeMentors>);
    vi.mocked(useReplyForm).mockReturnValue({
      reply: "",
      setReply,
      sendReply,
      isSending: false,
      error: null,
    } as ReturnType<typeof useReplyForm>);
    vi.mocked(useSlotBooking).mockReturnValue({
      scheduledSlotId: null,
      bookSlot,
      isBooking: false,
      error: null,
    } as ReturnType<typeof useSlotBooking>);
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
    } as ReturnType<typeof useReplyForm>);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.click(screen.getByText("Yanıtı Gönder"));
    expect(sendReply).toHaveBeenCalled();
  });

  it("books a real availability slot when accepted", async () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: { ...requestFixture, status: MentorshipRequestStatus.Accepted },
      error: null,
    } as ReturnType<typeof useMentorshipRequest>);
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
    } as ReturnType<typeof useMentorAvailability>);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.click(screen.getByText(/dk/));
    expect(bookSlot).toHaveBeenCalledWith("slot-1");
  });

  it("shows the already-scheduled state instead of the slot picker", () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: { ...requestFixture, status: MentorshipRequestStatus.Accepted },
      error: null,
    } as ReturnType<typeof useMentorshipRequest>);
    vi.mocked(useSlotBooking).mockReturnValue({
      scheduledSlotId: "slot-1",
      bookSlot,
      isBooking: false,
      error: null,
    } as ReturnType<typeof useSlotBooking>);

    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Toplantı planlandı")).toBeInTheDocument();
  });

  it("shows the mentor conversation thread when accepted", async () => {
    vi.mocked(useMentorshipRequest).mockReturnValue({
      data: { ...requestFixture, status: MentorshipRequestStatus.Accepted },
      error: null,
    } as ReturnType<typeof useMentorshipRequest>);

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
    } as ReturnType<typeof useMentorshipRequest>);
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
    } as ReturnType<typeof useMentorshipRequest>);
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
    } as ReturnType<typeof useAlternativeMentors>);

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
    } as ReturnType<typeof useMentorshipRequest>);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.click(screen.getByText("Talebi Geri Çek"));
    expect(mutateAsync).toHaveBeenCalled();
  });
});
