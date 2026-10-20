import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileTaskTab, useMobileTasks } from "@/hooks/use-mobile-tasks";
import { ActionItemStatus } from "@/interfaces/action-item";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  changeActionItemStatus,
  getActionItems,
} from "@/lib/client/action-items";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getMemberProgramEvents } from "@/lib/client/programs";
import { getMeetingFeedback } from "@/lib/client/meetings";
import { getStartupProcess } from "@/lib/client/startup-process";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  menteeActionItemFixture,
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-requests", () => ({ getMentorRequests: vi.fn() }));
vi.mock("@/lib/client/action-items", () => {
  const getActionItems = vi.fn();
  return {
    getActionItems,
    // The hooks batch through getActionItemsForRequests; it answers from the per-request fixtures,
    // tagging each item with its request so the hooks can group them.
    getActionItemsForRequests: vi.fn(async (ids: string[]) =>
      (
        await Promise.all(
          ids.map(async (id) =>
            ((await getActionItems(id)) ?? []).map((item: object) => ({
              ...item,
              mentorshipRequestId: id,
            })),
          ),
        )
      ).flat(),
    ),
    changeActionItemStatus: vi.fn(),
  };
});
vi.mock("@/lib/client/startup-process", () => ({ getStartupProcess: vi.fn() }));
vi.mock("@/lib/client/programs", () => ({ getMemberProgramEvents: vi.fn() }));
vi.mock("@/lib/client/meetings", () => ({ getMeetingFeedback: vi.fn() }));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { userId: "mentee-1" } }),
}));
let mockMeetings: MeetingItem[] = [];
vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => ({ data: mockMeetings }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const DUE_TOMORROW = new Date(Date.now() + 86_400_000)
  .toISOString()
  .slice(0, 10);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMentorRequests).mockResolvedValue([
    menteeRequestFixture({
      id: "r1",
      status: MentorshipRequestStatus.Accepted,
    }),
  ]);
  vi.mocked(getActionItems).mockResolvedValue([
    menteeActionItemFixture({ id: "a1", dueDate: DUE_TOMORROW }),
    menteeActionItemFixture({
      id: "a2",
      status: ActionItemStatus.Completed,
    }),
  ]);
  vi.mocked(getStartupProcess).mockRejectedValue(new Error("no startup"));
  vi.mocked(getMemberProgramEvents).mockResolvedValue([]);
  vi.mocked(getMeetingFeedback).mockResolvedValue(null);
  mockMeetings = [];
  vi.mocked(changeActionItemStatus).mockResolvedValue(
    menteeActionItemFixture(),
  );
});

describe("useMobileTasks", () => {
  it("counts open and completed tasks even without a startup process", async () => {
    const { result } = renderHook(() => useMobileTasks(), { wrapper });

    await waitFor(() =>
      expect(result.current.counts).toEqual({ open: 1, done: 1 }),
    );
    expect(result.current.isError).toBe(false);
  });

  it("lists a held meeting the mentee has not rated under Değerlendirmeler", async () => {
    mockMeetings = [
      menteeMeetingFixture({ id: "m1", mentorName: "Leyla Aksoy" }),
    ];
    const { result } = renderHook(() => useMobileTasks(), { wrapper });

    await waitFor(() =>
      expect(result.current.groups.map((group) => group.label)).toContain(
        "Değerlendirmeler",
      ),
    );
    expect(result.current.counts.open).toBe(2);
  });

  it("completes a mentorship task and offers to undo it", async () => {
    const { result } = renderHook(() => useMobileTasks(), { wrapper });
    await waitFor(() => expect(result.current.counts.open).toBe(1));
    const task = result.current.groups[0]!.tasks[0]!;

    act(() => result.current.complete(task));

    await waitFor(() =>
      expect(result.current.justCompleted?.id).toBe("action:a1"),
    );
    expect(changeActionItemStatus).toHaveBeenCalledWith({
      id: "a1",
      requestId: "r1",
      status: ActionItemStatus.Completed,
    });

    act(() => result.current.undo());

    await waitFor(() =>
      expect(changeActionItemStatus).toHaveBeenLastCalledWith({
        id: "a1",
        requestId: "r1",
        status: ActionItemStatus.Open,
      }),
    );
    expect(result.current.justCompleted).toBeNull();
  });

  it("switches between the open and completed tabs", () => {
    const { result } = renderHook(() => useMobileTasks(), { wrapper });

    act(() => result.current.setTab(MobileTaskTab.Done));

    expect(result.current.tab).toBe(MobileTaskTab.Done);
  });
});
