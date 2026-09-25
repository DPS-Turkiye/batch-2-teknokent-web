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
import { getStartupProcess } from "@/lib/client/startup-process";
import {
  menteeActionItemFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-requests", () => ({ getMentorRequests: vi.fn() }));
vi.mock("@/lib/client/action-items", () => ({
  getActionItems: vi.fn(),
  changeActionItemStatus: vi.fn(),
}));
vi.mock("@/lib/client/startup-process", () => ({ getStartupProcess: vi.fn() }));
vi.mock("@/lib/client/programs", () => ({ getMemberProgramEvents: vi.fn() }));

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
