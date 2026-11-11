import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ORGANIZATION_INVITE_QUERY_KEY,
  useInviteCodeCard,
  useOrganizationInvite,
} from "@/hooks/use-organization-invite";
import { ToastTone } from "@/interfaces/toast";
import {
  getInviteCode,
  rotateInviteCode,
} from "@/lib/client/organization-invite";
import { useToastStore } from "@/stores/toast-store";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/lib/client/organization-invite", () => ({
  getInviteCode: vi.fn(),
  rotateInviteCode: vi.fn(),
}));

const writeText = vi.fn(async (_text: string) => {});

function toasts() {
  return useToastStore
    .getState()
    .toasts.map(({ message, tone }) => ({ message, tone }));
}

describe("organization invite hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getInviteCode).mockResolvedValue({
      organizationId: "org-1",
      inviteCode: "OLD-CODE",
    });
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window.navigator, "clipboard");
  });

  it("useOrganizationInvite does not ask for the code while disabled", () => {
    const { result } = renderHook(
      () => useOrganizationInvite({ enabled: false }),
      queryWrapper(),
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(getInviteCode).not.toHaveBeenCalled();
  });

  it("shows no code while loading, then the startup's invite code", async () => {
    const { result } = renderHook(() => useInviteCodeCard(), queryWrapper());

    expect(result.current.code).toBeNull();
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.code).toBe("OLD-CODE"));
  });

  it("copies the code to the clipboard and confirms it", async () => {
    const { result } = renderHook(() => useInviteCodeCard(), queryWrapper());
    await waitFor(() => expect(result.current.code).toBe("OLD-CODE"));

    await act(() => result.current.copy());

    expect(writeText).toHaveBeenCalledWith("OLD-CODE");
    expect(result.current.copied).toBe(true);
    expect(toasts()).toEqual([
      { message: "Davet kodu kopyalandı.", tone: ToastTone.Success },
    ]);
  });

  it("copies nothing before the code has loaded", async () => {
    vi.mocked(getInviteCode).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useInviteCodeCard(), queryWrapper());

    await act(() => result.current.copy());

    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.copied).toBe(false);
  });

  it("puts the rotated code in the cache and clears the copied mark", async () => {
    vi.mocked(rotateInviteCode).mockResolvedValue({
      organizationId: "org-1",
      inviteCode: "NEW-CODE",
    });
    const { queryClient, wrapper } = queryWrapper();
    const { result } = renderHook(() => useInviteCodeCard(), { wrapper });
    await waitFor(() => expect(result.current.code).toBe("OLD-CODE"));
    await act(() => result.current.copy());

    await act(() => result.current.rotate());

    expect(result.current.code).toBe("NEW-CODE");
    expect(result.current.copied).toBe(false);
    expect(queryClient.getQueryData(ORGANIZATION_INVITE_QUERY_KEY)).toEqual({
      organizationId: "org-1",
      inviteCode: "NEW-CODE",
    });
    expect(toasts().at(-1)).toEqual({
      message: "Yeni davet kodu üretildi.",
      tone: ToastTone.Success,
    });
  });

  it("keeps the old code and shows the reason when rotating fails", async () => {
    vi.mocked(rotateInviteCode).mockRejectedValue(
      new Error("Yalnızca kurucu yeni kod üretebilir."),
    );
    const { result } = renderHook(() => useInviteCodeCard(), queryWrapper());
    await waitFor(() => expect(result.current.code).toBe("OLD-CODE"));

    await act(() => result.current.rotate());

    expect(result.current.code).toBe("OLD-CODE");
    expect(toasts()).toEqual([
      {
        message: "Yalnızca kurucu yeni kod üretebilir.",
        tone: ToastTone.Error,
      },
    ]);
  });

  it("falls back to its own wording when rotating fails with a non-Error", async () => {
    vi.mocked(rotateInviteCode).mockRejectedValue("offline");
    const { result } = renderHook(() => useInviteCodeCard(), queryWrapper());

    await act(() => result.current.rotate());

    expect(toasts()).toEqual([
      { message: "Yeni kod üretilemedi.", tone: ToastTone.Error },
    ]);
  });
});
