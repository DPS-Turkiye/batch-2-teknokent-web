import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppSession } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useStartupTeam } from "@/hooks/use-startup-team";
import { useStartupInProgram } from "@/hooks/use-team-changes";
import {
  addOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/lib/client/organization-members";
import { MemberFormMode } from "@/lib/startup-team";
import { requestRemoval } from "@/lib/client/team-changes";
import { memberFixture } from "@test/fixtures/startup-team";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: vi.fn(),
}));
vi.mock("@/hooks/use-organization-members", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/hooks/use-organization-members")
  >()),
  useOrganizationMembers: vi.fn(),
}));
vi.mock("@/hooks/use-team-changes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-team-changes")>()),
  useStartupInProgram: vi.fn(),
}));
vi.mock("@/lib/client/team-changes", () => ({ requestRemoval: vi.fn() }));
vi.mock("@/lib/client/organization-members", () => ({
  addOrganizationMember: vi.fn(),
  removeOrganizationMember: vi.fn(),
  updateOrganizationMember: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

const founder = memberFixture("founder", {
  fullName: "Gülse Buran",
  founder: true,
});
const cto = memberFixture("cto");
const designer = memberFixture("designer", { fullName: "Ece Demir" });

function signedInAs(userId: string) {
  vi.mocked(useAppSession).mockReturnValue({ userId } as never);
}

describe("useStartupTeam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStartupInProgram).mockReturnValue(false);
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [cto, founder, designer],
      isLoading: false,
      error: null,
    } as never);
  });

  it("lists the founder first", () => {
    signedInAs("founder");
    const { result } = renderHook(() => useStartupTeam(), { wrapper });

    expect(result.current.members.map((member) => member.id)).toEqual([
      "founder",
      "cto",
      "designer",
    ]);
  });

  it("lets the founder edit anyone and remove anyone but themself", () => {
    signedInAs("founder");
    const { result } = renderHook(() => useStartupTeam(), { wrapper });

    expect(result.current.canEdit(cto)).toBe(true);
    expect(result.current.canRemove(cto)).toBe(true);
    expect(result.current.canRemove(founder)).toBe(false);
  });

  it("lets a member edit only themself and remove no one", () => {
    signedInAs("cto");
    const { result } = renderHook(() => useStartupTeam(), { wrapper });

    expect(result.current.canEdit(cto)).toBe(true);
    expect(result.current.canEdit(designer)).toBe(false);
    expect(result.current.canRemove(designer)).toBe(false);
  });

  it("checks the draft before adding, then adds and closes", async () => {
    signedInAs("founder");
    vi.mocked(addOrganizationMember).mockResolvedValue(designer);
    const { result } = renderHook(() => useStartupTeam(), { wrapper });

    act(() => result.current.openAdd());
    await act(() => result.current.submitForm());
    expect(result.current.formError).toBe("Ad soyad gerekli.");
    expect(addOrganizationMember).not.toHaveBeenCalled();

    act(() => {
      result.current.setField("fullName", " Ece Demir ");
      result.current.setField("email", "ece@dongu.co");
      result.current.setField("jobTitle", "Tasarımcı");
    });
    await act(() => result.current.submitForm());

    expect(vi.mocked(addOrganizationMember).mock.calls[0][0]).toEqual({
      fullName: "Ece Demir",
      email: "ece@dongu.co",
      jobTitle: "Tasarımcı",
    });
    expect(result.current.draft).toBeNull();
  });

  it("edits a member's name and title", async () => {
    signedInAs("founder");
    vi.mocked(updateOrganizationMember).mockResolvedValue(cto);
    const { result } = renderHook(() => useStartupTeam(), { wrapper });

    act(() => result.current.openEdit(cto));
    expect(result.current.draft).toMatchObject({
      mode: MemberFormMode.Edit,
      fullName: "Kerem Aksoy",
      jobTitle: "CTO",
    });
    act(() => result.current.setField("jobTitle", "CEO"));
    await act(() => result.current.submitForm());

    expect(updateOrganizationMember).toHaveBeenCalledWith("cto", {
      fullName: "Kerem Aksoy",
      jobTitle: "CEO",
    });
    expect(result.current.draft).toBeNull();
  });

  it("keeps the form open when saving fails", async () => {
    signedInAs("founder");
    vi.mocked(updateOrganizationMember).mockRejectedValue(
      new Error("Yetkin yok."),
    );
    const { result } = renderHook(() => useStartupTeam(), { wrapper });

    act(() => result.current.openEdit(cto));
    await act(() => result.current.submitForm());

    expect(result.current.draft).not.toBeNull();
  });

  it("removes a member after confirming", async () => {
    signedInAs("founder");
    vi.mocked(removeOrganizationMember).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useStartupTeam(), { wrapper });

    act(() => result.current.askRemove("cto"));
    expect(result.current.removingMember).toBe(cto);
    act(() => result.current.confirmRemove());

    await waitFor(() => expect(result.current.removingMember).toBeNull());
    expect(vi.mocked(removeOrganizationMember).mock.calls[0][0]).toBe("cto");
  });

  it("only asks the coordinator to remove a member inside a program", async () => {
    signedInAs("founder");
    vi.mocked(useStartupInProgram).mockReturnValue(true);
    vi.mocked(requestRemoval).mockResolvedValue({} as never);
    const { result } = renderHook(() => useStartupTeam(), { wrapper });

    expect(result.current.removalNeedsApproval).toBe(true);
    act(() => result.current.askRemove("cto"));
    act(() => result.current.confirmRemove());

    await waitFor(() => expect(result.current.removingMember).toBeNull());
    expect(vi.mocked(requestRemoval).mock.calls[0][0]).toBe("cto");
    expect(removeOrganizationMember).not.toHaveBeenCalled();
  });
});
