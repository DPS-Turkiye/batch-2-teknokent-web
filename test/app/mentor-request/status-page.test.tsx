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
import { MeetingStatus } from "@/interfaces/meeting";
import type { MentorAvailabilitySlot } from "@/interfaces/mentor";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { logMentorshipMeeting } from "@/lib/client/mentor-requests";
import { mentorProfile } from "@test/fixtures/mentors";
import { mentorshipRequest } from "@test/fixtures/mentorship-requests";
import {
  idleMutation,
  idleQuery,
  successQuery,
} from "@test/mocks/query-results";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

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

const requestFixture = mentorshipRequest({
  id: "request-1",
  requesterId: "requester-1",
  organizationName: "GreenLoop",
  mentorName: "Leyla Aksoy",
  supportArea: "İş modeli ve strateji",
  summary: "fs",
  requesterMessage: "sfs",
  status: MentorshipRequestStatus.MoreInfoRequested,
  createdAt: "2026-08-17T09:49:54.374504Z",
});

/** The open request, loaded, with `changes` applied to the fixture. */
function showRequest(changes: Partial<MentorshipRequest> = {}) {
  vi.mocked(useMentorshipRequest).mockReturnValue(
    successQuery({ ...requestFixture, ...changes }),
  );
}

/** The mentee's request list, loaded. */
function showRequestList(requests: MentorshipRequest[]) {
  vi.mocked(useMentorshipRequests).mockReturnValue(successQuery(requests));
}

function showAvailability(slots: MentorAvailabilitySlot[]) {
  vi.mocked(useMentorAvailability).mockReturnValue(successQuery(slots));
}

type ReplyForm = ReturnType<typeof useReplyForm>;
type SlotBooking = ReturnType<typeof useSlotBooking>;
type Withdraw = ReturnType<typeof useWithdrawMentorRequest>;
type FileUpload = ReturnType<typeof useRequestFileUpload>;
type AcceptProposal = ReturnType<typeof useAcceptProposedSlot>;

describe("RequestStatusPage", () => {
  const setReply = vi.fn<ReplyForm["setReply"]>();
  const sendReply = vi.fn<ReplyForm["sendReply"]>();
  const bookSlot = vi.fn<SlotBooking["bookSlot"]>();
  const mutateAsync = vi.fn<Withdraw["mutateAsync"]>();
  const uploadFile = vi.fn<FileUpload["mutateAsync"]>();
  const acceptProposal = vi.fn<AcceptProposal["mutateAsync"]>();

  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.current = new URLSearchParams("request=request-1");
    showRequestList([requestFixture]);
    showRequest();
    showAvailability([]);
    vi.mocked(useAlternativeMentors).mockReturnValue(successQuery([]));
    vi.mocked(useReplyForm).mockReturnValue({
      reply: "",
      setReply,
      sendReply,
      isSending: false,
      error: null,
    });
    vi.mocked(useSlotBooking).mockReturnValue({
      scheduledSlotId: null,
      bookSlot,
      isBooking: false,
      error: null,
    });
    vi.mocked(useWithdrawMentorRequest).mockReturnValue(
      idleMutation({ mutateAsync }),
    );
    vi.mocked(useRequestFileUpload).mockReturnValue(
      idleMutation({ mutateAsync: uploadFile }),
    );
    vi.mocked(useAcceptProposedSlot).mockReturnValue(
      idleMutation({ mutateAsync: acceptProposal }),
    );
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

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <RequestStatusPage />
      </InLocale>,
    );

    expect(screen.getByText("Request details")).toBeInTheDocument();
    expect(screen.getByText("Where are we stuck?")).toBeInTheDocument();
    expect(screen.getByText("The mentor's question:")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Write your reply…"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("More info requested")).not.toHaveLength(0);
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
    });

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.click(screen.getByText("Yanıtı Gönder"));
    expect(sendReply).toHaveBeenCalled();
  });

  it("books a real availability slot when accepted", async () => {
    showRequest({ status: MentorshipRequestStatus.Accepted });
    showAvailability([
      {
        id: "slot-1",
        startsAt: "2026-08-26T08:00:00.000Z",
        durationMinutes: 60,
        booked: false,
      },
    ]);

    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    await user.click(screen.getByText(/dk/));
    expect(bookSlot).toHaveBeenCalledWith("slot-1");
  });

  it("shows the already-scheduled state instead of the slot picker", () => {
    showRequest({ status: MentorshipRequestStatus.Accepted });
    vi.mocked(useSlotBooking).mockReturnValue({
      scheduledSlotId: "slot-1",
      bookSlot,
      isBooking: false,
      error: null,
    });

    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Toplantı planlandı")).toBeInTheDocument();
  });

  it("shows the mentor conversation thread when accepted", async () => {
    showRequest({ status: MentorshipRequestStatus.Accepted });

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
    showRequest({ status: MentorshipRequestStatus.Accepted });
    const user = userEvent.setup();
    renderWithQueryClient(<RequestStatusPage />);

    const file = new File(["content"], "financial-model.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText("Mentorluk dosyası yükle"), file);

    expect(uploadFile).toHaveBeenCalledWith(file);
  });

  it("shows alternative mentors when declined", () => {
    showRequest({
      status: MentorshipRequestStatus.Declined,
      rejectionReason: "Uygun zaman yok",
    });
    vi.mocked(useAlternativeMentors).mockReturnValue(
      successQuery([
        {
          ...mentorProfile,
          id: "mentor-2",
          initials: "AK",
          fullName: "Aslıhan Koç",
          professionalTitle: "Program Danışmanı",
          company: "Teknokent",
        },
      ]),
    );

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
    showRequest({ status: MentorshipRequestStatus.Pending });

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
      organizationId: "org-1",
      mentorId: "mentor-1",
      mentorshipRequestId: "request-1",
      scheduledAt: "2026-09-12T12:00:00.000Z",
      durationMinutes: 45,
      status: MeetingStatus.Scheduled,
    });
    showRequest({
      status: MentorshipRequestStatus.CounterProposed,
      mentorMessage:
        "Mentörün önerdiği saatler: 12 Eylül Cumartesi · 15:00\nproposedSlots:2026-09-12T15:00",
    });

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
    // With no request picked, the request query is disabled.
    vi.mocked(useMentorshipRequest).mockReturnValue(idleQuery());

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
    showRequestList([
      { ...requestFixture, status: MentorshipRequestStatus.Accepted },
    ]);

    renderWithQueryClient(<RequestStatusPage />);

    expect(screen.getByText("Talep bilgileri")).toBeInTheDocument();
    expect(
      screen.queryByText("Görüntülenecek bir talep seçilmedi."),
    ).not.toBeInTheDocument();
  });
});
