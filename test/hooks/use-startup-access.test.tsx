import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStartupAccess } from "@/hooks/use-startup-access";
import {
  UserAccountStatus,
  UserRole,
  type AppSession,
} from "@/interfaces/session";
import { getStartupProfile } from "@/lib/client/organization";
import { StartupAccess } from "@/lib/startup-access";
import { queryWrapper } from "@test/fixtures/query-wrapper";
import { startupProfile } from "@test/fixtures/startup-profile";

const viewer = vi.hoisted(() => ({ session: null as AppSession | null }));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: viewer.session }),
}));
vi.mock("@/lib/client/organization", () => ({ getStartupProfile: vi.fn() }));

const mentee: AppSession = {
  userId: "user-1",
  email: "ada@acme.test",
  fullName: "Ada Kaya",
  jobTitle: "",
  role: UserRole.Mentee,
};

describe("useStartupAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    viewer.session = { ...mentee, organizationId: "org-1" };
  });

  it.each([UserRole.Mentor, UserRole.Coordinator, UserRole.Admin])(
    "lets a %s through without reading any startup",
    (role) => {
      viewer.session = { ...mentee, role };

      const { result } = renderHook(() => useStartupAccess(), queryWrapper());

      expect(result.current).toEqual({
        access: StartupAccess.Ready,
        isLoading: false,
      });
      expect(getStartupProfile).not.toHaveBeenCalled();
    },
  );

  it("says a mentee without a startup has none, without loading", () => {
    viewer.session = mentee;

    const { result } = renderHook(() => useStartupAccess(), queryWrapper());

    expect(result.current).toEqual({
      access: StartupAccess.None,
      isLoading: false,
    });
    expect(getStartupProfile).not.toHaveBeenCalled();
  });

  it.each([
    [UserAccountStatus.Pending, StartupAccess.Pending],
    [UserAccountStatus.Rejected, StartupAccess.Rejected],
    [UserAccountStatus.Approved, StartupAccess.Ready],
  ])(
    "reads a %s startup as %s once its profile loads",
    async (approvalStatus, access) => {
      vi.mocked(getStartupProfile).mockResolvedValue(
        startupProfile({ approvalStatus }),
      );

      const { result } = renderHook(() => useStartupAccess(), queryWrapper());

      expect(result.current.isLoading).toBe(true);
      await waitFor(() =>
        expect(result.current).toEqual({ access, isLoading: false }),
      );
    },
  );
});
