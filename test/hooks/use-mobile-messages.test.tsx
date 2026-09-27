import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileMessages } from "@/hooks/use-mobile-messages";
import { CoordinatorConversationCounterpart } from "@/interfaces/coordinator-conversation";
import {
  MentorshipRequestMessageType,
  MentorshipRequestStatus,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { getCoordinatorConversations } from "@/lib/client/coordinator-conversations";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getMyAnnouncements } from "@/lib/client/program-announcements";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";
import { programAnnouncement } from "@test/fixtures/program-announcements";
import { createTestQueryClient } from "@test/test-utils";

let role = UserRole.Mentee;

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { userId: "mentee-1", role } }),
}));
vi.mock("@/lib/client/mentor-requests", () => ({
  getMentorRequests: vi.fn(),
}));
vi.mock("@/lib/client/coordinator-conversations", () => ({
  getCoordinatorConversations: vi.fn(),
}));
vi.mock("@/lib/client/program-announcements", () => ({
  getMyAnnouncements: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  role = UserRole.Mentee;
  vi.mocked(getMyAnnouncements).mockResolvedValue([]);
  vi.mocked(getMentorRequests).mockResolvedValue([
    menteeRequestFixture({
      id: "open",
      status: MentorshipRequestStatus.Accepted,
      mentorName: "Barış Öztürk",
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
    }),
    menteeRequestFixture({
      id: "closed",
      status: MentorshipRequestStatus.Declined,
      mentorName: "Ayşe Kaya",
    }),
  ]);
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
      unread: true,
      unreadCount: 2,
    },
  ]);
});

describe("useMobileMessages", () => {
  it("lists open mentorship threads and program threads together with the unread total", async () => {
    const { result } = renderHook(() => useMobileMessages(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.conversations.map((item) => item.name)).toEqual([
      "Barış Öztürk",
      "METU Stars",
    ]);
    expect(result.current.unreadTotal).toBe(3);
    expect(getMentorRequests).toHaveBeenCalledWith(UserRole.Mentee);
  });

  it("filters the list by name", async () => {
    const { result } = renderHook(() => useMobileMessages(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setQuery("metu"));

    expect(result.current.shown.map((item) => item.name)).toEqual([
      "METU Stars",
    ]);
  });

  it("loads the mentor's own requests for a mentor", async () => {
    role = UserRole.Mentor;
    const { result } = renderHook(() => useMobileMessages(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getMentorRequests).toHaveBeenCalledWith(UserRole.Mentor);
  });

  it("asks for nothing when a coordinator lands here", () => {
    role = UserRole.Coordinator;
    renderHook(() => useMobileMessages(), { wrapper });

    expect(getMentorRequests).not.toHaveBeenCalled();
    expect(getCoordinatorConversations).not.toHaveBeenCalled();
  });

  it("adds each program's Duyurular as a read-only thread", async () => {
    vi.mocked(getMyAnnouncements).mockResolvedValue([
      programAnnouncement({ createdAt: "2026-09-25T10:00:00Z" }),
    ]);
    const { result } = renderHook(() => useMobileMessages(), { wrapper });

    await waitFor(() =>
      expect(result.current.conversations.map((item) => item.name)).toContain(
        "METU Stars 2026 — Duyuru",
      ),
    );
    const announcement = result.current.conversations.find(
      (item) => item.tag === "Duyuru",
    );
    expect(announcement?.href).toBe("/m/messages/announcement/program-1");
    expect(announcement?.unreadCount).toBe(0);
  });
});
