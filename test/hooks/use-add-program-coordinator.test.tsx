import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAddProgramCoordinator } from "@/hooks/use-add-program-coordinator";
import {
  COORDINATOR_INVITE_CHECK_QUERY_KEY,
  COORDINATOR_SEARCH_QUERY_KEY,
} from "@/hooks/use-coordinator-picker";
import { ToastTone } from "@/interfaces/toast";
import {
  addProgramCoordinator,
  inviteProgramCoordinator,
} from "@/lib/client/coordinator-programs";
import { existingChoice, invitedChoice } from "@/lib/coordinator-picker";
import { useToastStore } from "@/stores/toast-store";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/lib/client/coordinator-programs", () => ({
  addProgramCoordinator: vi.fn(),
  inviteProgramCoordinator: vi.fn(),
}));

const mert = { id: "c-2", fullName: "Mert Kaya", email: "mert@x.org" };

function lastToast() {
  const toast = useToastStore.getState().toasts.at(-1);
  return toast ? { message: toast.message, tone: toast.tone } : null;
}

describe("useAddProgramCoordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addProgramCoordinator).mockResolvedValue([]);
    vi.mocked(inviteProgramCoordinator).mockResolvedValue([]);
  });

  it("adds an existing coordinator by id, refreshes the searches and reports it", async () => {
    const onAdded = vi.fn<() => void>();
    const { queryClient, wrapper } = queryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useAddProgramCoordinator("p-1", onAdded),
      { wrapper },
    );

    act(() => result.current.pick([existingChoice(mert)]));

    await waitFor(() => expect(onAdded).toHaveBeenCalled());
    expect(addProgramCoordinator).toHaveBeenCalledWith("p-1", "c-2");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: COORDINATOR_SEARCH_QUERY_KEY,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: COORDINATOR_INVITE_CHECK_QUERY_KEY,
    });
    expect(lastToast()).toEqual({
      message: "Mert Kaya programa eklendi.",
      tone: ToastTone.Success,
    });
  });

  it("invites an e-mail and says where the password mail went", async () => {
    const onAdded = vi.fn<() => void>();
    const { result } = renderHook(
      () => useAddProgramCoordinator("p-1", onAdded),
      queryWrapper(),
    );

    act(() => result.current.pick([invitedChoice("yeni@x.org", "Yeni Kişi")]));

    await waitFor(() => expect(onAdded).toHaveBeenCalled());
    expect(inviteProgramCoordinator).toHaveBeenCalledWith("p-1", {
      fullName: "Yeni Kişi",
      email: "yeni@x.org",
    });
    expect(lastToast()).toEqual({
      message:
        "Yeni Kişi programa eklendi; şifre belirleme e-postası yeni@x.org adresine gönderildi.",
      tone: ToastTone.Success,
    });
  });

  it("shows the backend's refusal and does not report success", async () => {
    vi.mocked(addProgramCoordinator).mockRejectedValue(
      new Error("Bu koordinatör programı zaten yürütüyor."),
    );
    const onAdded = vi.fn<() => void>();
    const { result } = renderHook(
      () => useAddProgramCoordinator("p-1", onAdded),
      queryWrapper(),
    );

    act(() => result.current.pick([existingChoice(mert)]));

    await waitFor(() =>
      expect(lastToast()).toEqual({
        message: "Bu koordinatör programı zaten yürütüyor.",
        tone: ToastTone.Error,
      }),
    );
    expect(onAdded).not.toHaveBeenCalled();
  });

  it("ignores an empty pick", () => {
    const { result } = renderHook(
      () => useAddProgramCoordinator("p-1", vi.fn<() => void>()),
      queryWrapper(),
    );

    act(() => result.current.pick([]));

    expect(addProgramCoordinator).not.toHaveBeenCalled();
    expect(inviteProgramCoordinator).not.toHaveBeenCalled();
  });
});
