import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PENDING_MEMBERS_QUERY_KEY,
  usePendingMembers,
} from "@/hooks/use-pending-members";
import type { OrganizationPendingMember } from "@/interfaces/organization-member";
import { ToastTone } from "@/interfaces/toast";
import {
  getPendingMembers,
  removePendingMember,
} from "@/lib/client/organization-members";
import { useToastStore } from "@/stores/toast-store";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/lib/client/organization-members", () => ({
  getPendingMembers: vi.fn(),
  removePendingMember: vi.fn(),
}));

const pending: OrganizationPendingMember = {
  id: "pending-1",
  fullName: "Deniz Ak",
  jobTitle: "CTO",
  email: "deniz@acme.test",
  createdAt: "2026-02-01T10:00:00Z",
};

function toasts() {
  return useToastStore
    .getState()
    .toasts.map(({ message, tone }) => ({ message, tone }));
}

describe("usePendingMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPendingMembers).mockResolvedValue([pending]);
  });

  it("lists nobody until the pending teammates load", async () => {
    const { result } = renderHook(() => usePendingMembers(), queryWrapper());

    expect(result.current.pending).toEqual([]);
    await waitFor(() => expect(result.current.pending).toEqual([pending]));
    expect(result.current.removingId).toBeNull();
  });

  it("marks the teammate being removed, then reloads the list and confirms", async () => {
    let finish = () => {};
    vi.mocked(removePendingMember).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { queryClient, wrapper } = queryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => usePendingMembers(), { wrapper });
    await waitFor(() => expect(result.current.pending).toHaveLength(1));

    act(() => result.current.remove("pending-1"));
    await waitFor(() => expect(result.current.removingId).toBe("pending-1"));
    expect(removePendingMember).toHaveBeenCalledWith(
      "pending-1",
      expect.anything(),
    );

    act(() => finish());
    await waitFor(() => expect(result.current.removingId).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: PENDING_MEMBERS_QUERY_KEY,
    });
    expect(toasts()).toEqual([
      {
        message: "Bekleyen üye listeden çıkarıldı.",
        tone: ToastTone.Success,
      },
    ]);
  });

  it("shows the server's reason when the removal fails", async () => {
    vi.mocked(removePendingMember).mockRejectedValue(
      new Error("Bu üye zaten katıldı."),
    );
    const { result } = renderHook(() => usePendingMembers(), queryWrapper());

    act(() => result.current.remove("pending-1"));

    await waitFor(() =>
      expect(toasts()).toEqual([
        { message: "Bu üye zaten katıldı.", tone: ToastTone.Error },
      ]),
    );
    expect(result.current.removingId).toBeNull();
  });

  it("falls back to its own wording when the failure is not an Error", async () => {
    vi.mocked(removePendingMember).mockRejectedValue("offline");
    const { result } = renderHook(() => usePendingMembers(), queryWrapper());

    act(() => result.current.remove("pending-1"));

    await waitFor(() =>
      expect(toasts()).toEqual([
        { message: "Bekleyen üye çıkarılamadı.", tone: ToastTone.Error },
      ]),
    );
  });
});
