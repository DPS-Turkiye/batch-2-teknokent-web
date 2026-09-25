import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileChat } from "@/hooks/use-mobile-chat";
import { CoordinatorConversationCounterpart } from "@/interfaces/coordinator-conversation";
import {
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { MobileConversationKind } from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import {
  getCoordinatorConversations,
  getCoordinatorMessages,
  sendCoordinatorMessage,
} from "@/lib/client/coordinator-conversations";
import {
  getMentorRequest,
  markMentorRequestRead,
  postMentorMessage,
  replyToMentorRequest,
} from "@/lib/client/mentor-requests";
import { getPrograms } from "@/lib/client/programs";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

let role = UserRole.Mentee;
let meetings = [menteeMeetingFixture()];

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { userId: "mentee-1", role } }),
}));
vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => ({ data: meetings }),
}));
vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));
vi.mock("@/lib/client/mentor-requests", () => ({
  getMentorRequest: vi.fn(),
  markMentorRequestRead: vi.fn(),
  postMentorMessage: vi.fn(),
  replyToMentorRequest: vi.fn(),
}));
vi.mock("@/lib/client/programs", () => ({ getPrograms: vi.fn() }));
vi.mock("@/lib/client/coordinator-conversations", () => ({
  getCoordinatorConversations: vi.fn(),
  getCoordinatorMessages: vi.fn(),
  sendCoordinatorMessage: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function request(overrides: Partial<MentorshipRequest> = {}) {
  return menteeRequestFixture({
    id: "r1",
    status: MentorshipRequestStatus.Accepted,
    messages: [
      {
        id: "m1",
        authorId: "mentor-1",
        authorName: "Barış Öztürk",
        messageType: MentorshipRequestMessageType.MentorMessage,
        body: "Merhaba",
        createdAt: "2026-09-24T10:00:00Z",
      },
    ],
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  role = UserRole.Mentee;
  meetings = [];
  vi.mocked(getMentorRequest).mockResolvedValue(request());
  vi.mocked(markMentorRequestRead).mockResolvedValue(
    request({ menteeReadAt: "2026-09-24T11:00:00Z" }),
  );
});

describe("useMobileChat for a mentorship thread", () => {
  it("marks the thread read when the mentor wrote since the team last looked", async () => {
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Mentorship, "r1"),
      { wrapper },
    );

    await waitFor(() =>
      expect(markMentorRequestRead).toHaveBeenCalledWith("r1"),
    );
    await waitFor(() =>
      expect(result.current.header?.name).toBe("Barış Öztürk"),
    );
    expect(markMentorRequestRead).toHaveBeenCalledTimes(1);
    expect(result.current.canAttach).toBe(true);
  });

  it("leaves an already read thread alone", async () => {
    vi.mocked(getMentorRequest).mockResolvedValue(
      request({ menteeReadAt: "2026-09-24T11:00:00Z" }),
    );
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Mentorship, "r1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(markMentorRequestRead).not.toHaveBeenCalled();
  });

  it("sends a mentee's message as a reply and clears the draft", async () => {
    vi.mocked(replyToMentorRequest).mockResolvedValue(request());
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Mentorship, "r1"),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setDraft("  Teşekkürler  "));
    act(() => result.current.submit());

    await waitFor(() =>
      expect(replyToMentorRequest).toHaveBeenCalledWith({
        id: "r1",
        message: "Teşekkürler",
      }),
    );
    await waitFor(() => expect(result.current.draft).toBe(""));
    expect(postMentorMessage).not.toHaveBeenCalled();
  });

  it("heads a mentor's thread with the startup, its program and the person who wrote", async () => {
    role = UserRole.Mentor;
    vi.mocked(getMentorRequest).mockResolvedValue(
      request({
        organizationId: "org-1",
        organizationName: "Atlas AI",
        requesterName: "Gamze Kozak",
      }),
    );
    vi.mocked(getPrograms).mockResolvedValue([
      { name: "METU Stars 2026", startups: [{ id: "org-1" }], mentors: [] },
    ] as never);
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Mentorship, "r1"),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.header?.subtitle).toBe(
        "METU Stars 2026 · Gamze Kozak",
      ),
    );
    expect(result.current.header).toMatchObject({
      name: "Atlas AI",
      isStartup: true,
    });
  });

  it("does not load programs for a mentee's thread", async () => {
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Mentorship, "r1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.header).not.toBeNull());
    expect(result.current.header?.isStartup).toBe(false);
    expect(getPrograms).not.toHaveBeenCalled();
  });

  it("sends a mentor's message as a mentor message", async () => {
    role = UserRole.Mentor;
    vi.mocked(postMentorMessage).mockResolvedValue(request());
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Mentorship, "r1"),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setDraft("Görüşelim"));
    act(() => result.current.submit());

    await waitFor(() =>
      expect(postMentorMessage).toHaveBeenCalledWith({
        id: "r1",
        message: "Görüşelim",
      }),
    );
  });

  it("shows the next meeting of this mentorship above the messages", async () => {
    meetings = [
      menteeMeetingFixture({
        id: "next",
        mentorshipRequestId: "r1",
        scheduledAt: new Date(2030, 0, 10, 14, 0).toISOString(),
      }),
    ];
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Mentorship, "r1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.strip).not.toBeNull());
    expect(result.current.strip?.href).toBe("/m/calendar?meeting=next");
  });

  it("stops sending on a closed request", async () => {
    vi.mocked(getMentorRequest).mockResolvedValue(
      request({
        status: MentorshipRequestStatus.Declined,
        menteeReadAt: "2026-09-24T11:00:00Z",
      }),
    );
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Mentorship, "r1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canSend).toBe(false);
  });
});

describe("useMobileChat for a program thread", () => {
  beforeEach(() => {
    vi.mocked(getCoordinatorConversations).mockResolvedValue([
      {
        id: "p1",
        programId: "program-1",
        programName: "METU Stars",
        counterpartType: CoordinatorConversationCounterpart.Team,
        counterpartId: "org-1",
        counterpartName: "Atlas AI",
        coordinatorId: "coordinator-1",
        coordinatorName: "Burcu Şen",
        lastMessagePreview: "Duyuru",
        lastMessageAt: "2026-09-23T10:00:00Z",
        unread: false,
        unreadCount: 0,
        otherSideReadAt: null,
      },
    ]);
    vi.mocked(getCoordinatorMessages).mockResolvedValue([]);
  });

  it("titles the thread with the program and its coordinator, without attachments", async () => {
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Program, "p1"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.header).not.toBeNull());
    expect(result.current.header).toMatchObject({
      name: "METU Stars",
      subtitle: "Koordinatör · Burcu Şen",
    });
    expect(result.current.canAttach).toBe(false);
    expect(getMentorRequest).not.toHaveBeenCalled();
  });

  it("sends through the coordinator conversation", async () => {
    vi.mocked(sendCoordinatorMessage).mockResolvedValue({
      id: "m1",
      senderId: "mentee-1",
      senderName: "Gamze Kozak",
      mine: true,
      body: "Teşekkürler",
      createdAt: "2026-09-25T09:00:00Z",
    });
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Program, "p1"),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setDraft("Teşekkürler"));
    act(() => result.current.submit());

    await waitFor(() =>
      expect(sendCoordinatorMessage).toHaveBeenCalledWith("p1", "Teşekkürler"),
    );
  });

  it("reports a thread the viewer cannot see", async () => {
    const { result } = renderHook(
      () => useMobileChat(MobileConversationKind.Program, "missing"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notFound).toBe(true);
  });
});
