import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileAccount } from "@/hooks/use-mobile-account";
import { UserRole } from "@/interfaces/session";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/client/notifications";
import { unregisterPushDevice } from "@/lib/push-device";
import { createTestQueryClient } from "@test/test-utils";

const replace = vi.fn();
const logout = vi.fn();
const order: string[] = [];

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    session: {
      userId: "u1",
      email: "gamze@atlasai.co",
      fullName: "Gamze Kozak",
      jobTitle: "Takım yetkilisi",
      role: UserRole.Mentee,
      organizationName: "Atlas AI",
    },
    logout,
  }),
}));
vi.mock("@/hooks/use-push-device", () => ({
  usePushDevice: () => ({
    state: "off",
    enable: vi.fn(),
    isEnabling: false,
    failed: false,
  }),
}));
vi.mock("@/lib/push-device", () => ({ unregisterPushDevice: vi.fn() }));
vi.mock("@/lib/client/notifications", () => ({
  getNotificationPreferences: vi.fn(),
  saveNotificationPreferences: vi.fn(),
}));

const PREFERENCES = {
  messages: true,
  meetingReminders: true,
  meetingChanges: true,
  newTasks: true,
  taskDeadlines: false,
  startupActivity: true,
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  order.length = 0;
  vi.mocked(getNotificationPreferences).mockResolvedValue(PREFERENCES);
  vi.mocked(unregisterPushDevice).mockImplementation(async () => {
    order.push("unregister");
  });
  logout.mockImplementation(async () => {
    order.push("logout");
  });
});

describe("useMobileAccount", () => {
  it("shows who is signed in", () => {
    const { result } = renderHook(() => useMobileAccount(), { wrapper });

    expect(result.current).toMatchObject({
      fullName: "Gamze Kozak",
      initials: "GK",
      chip: "Atlas AI · Takım yetkilisi",
    });
  });

  it("saves a flipped switch with every other choice unchanged", async () => {
    vi.mocked(saveNotificationPreferences).mockImplementation(
      async (next) => next,
    );
    const { result } = renderHook(() => useMobileAccount(), { wrapper });
    await waitFor(() => expect(result.current.preferences).not.toBeNull());

    act(() => result.current.toggle("taskDeadlines"));

    await waitFor(() =>
      expect(vi.mocked(saveNotificationPreferences).mock.calls[0]?.[0]).toEqual(
        { ...PREFERENCES, taskDeadlines: true },
      ),
    );
    expect(result.current.preferences?.taskDeadlines).toBe(true);
  });

  it("puts the switch back when saving fails", async () => {
    vi.mocked(saveNotificationPreferences).mockRejectedValue(new Error("x"));
    const { result } = renderHook(() => useMobileAccount(), { wrapper });
    await waitFor(() => expect(result.current.preferences).not.toBeNull());

    act(() => result.current.toggle("messages"));

    await waitFor(() => expect(result.current.saveFailed).toBe(true));
    expect(result.current.preferences?.messages).toBe(true);
  });

  it("stops pushes to this phone before signing out, then goes to login", async () => {
    const { result } = renderHook(() => useMobileAccount(), { wrapper });

    await act(() => result.current.signOut());

    expect(order).toEqual(["unregister", "logout"]);
    expect(replace).toHaveBeenCalledWith("/m/login");
  });

  it("still signs out when the phone could not be unregistered", async () => {
    vi.mocked(unregisterPushDevice).mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useMobileAccount(), { wrapper });

    await act(() => result.current.signOut());

    expect(logout).toHaveBeenCalled();
  });
});
