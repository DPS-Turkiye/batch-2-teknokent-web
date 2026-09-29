import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useHomeTaskNotebook,
  useTaskNotebook,
} from "@/hooks/use-task-notebook";
import { type ActionItem, ActionItemStatus } from "@/interfaces/action-item";
import {
  changeActionItemStatus,
  getActionItems,
} from "@/lib/client/action-items";
import type { HomeTask } from "@/lib/mentee-home";
import { DueTone, HomeTaskKind } from "@/types/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/action-items", () => ({
  addActionItem: vi.fn(),
  changeActionItemStatus: vi.fn(),
  getActionItems: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function item(id: string, status: ActionItemStatus): ActionItem {
  return {
    id,
    organizationId: "org-1",
    ownerId: "founder-1",
    title: id,
    status,
    createdAt: "2026-09-20T09:00:00Z",
    updatedAt: "2026-09-20T09:00:00Z",
  };
}

describe("useTaskNotebook", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists open tasks before finished ones and leaves out cancelled ones", async () => {
    vi.mocked(getActionItems).mockResolvedValue([
      item("done", ActionItemStatus.Completed),
      item("cancelled", ActionItemStatus.Cancelled),
      item("open", ActionItemStatus.Open),
    ]);

    const { result } = renderHook(() => useTaskNotebook("r1"), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.map((task) => task.id)).toEqual([
      "open",
      "done",
    ]);
    expect(getActionItems).toHaveBeenCalledWith("r1");
  });

  it("ticks a task done and unticks it back to open", async () => {
    vi.mocked(getActionItems).mockResolvedValue([
      item("a1", ActionItemStatus.Open),
    ]);
    vi.mocked(changeActionItemStatus).mockResolvedValue(
      item("a1", ActionItemStatus.Completed),
    );
    const { result } = renderHook(() => useTaskNotebook("r1"), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => result.current.toggle(result.current.items[0], true));
    await waitFor(() => expect(changeActionItemStatus).toHaveBeenCalled());
    expect(vi.mocked(changeActionItemStatus).mock.calls[0][0]).toEqual({
      id: "a1",
      requestId: "r1",
      status: ActionItemStatus.Completed,
    });

    act(() => result.current.toggle(result.current.items[0], false));
    await waitFor(() =>
      expect(changeActionItemStatus).toHaveBeenCalledTimes(2),
    );
    expect(vi.mocked(changeActionItemStatus).mock.calls[1][0]).toEqual({
      id: "a1",
      requestId: "r1",
      status: ActionItemStatus.Open,
    });
  });
});

describe("useHomeTaskNotebook", () => {
  it("opens and closes the popup for one task", () => {
    const task: HomeTask = {
      id: "action-a1",
      kind: HomeTaskKind.ActionItem,
      title: "Metrik panosunu paylaş",
      subtitle: "Selin Kaya · UX",
      dueTone: DueTone.Overdue,
      dueLabel: "Gecikti",
      actionLabel: "Görevi aç",
      href: "/mentorships",
      requestId: "r1",
    };
    const { result } = renderHook(() => useHomeTaskNotebook());

    act(() => result.current.open(task));
    expect(result.current.task).toBe(task);
    act(() => result.current.close());
    expect(result.current.task).toBeNull();
  });
});
