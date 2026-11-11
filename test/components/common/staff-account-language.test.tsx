import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { AdminFrame } from "@/components/admin/admin-frame";
import { CoordinatorFrame } from "@/components/coordinator/coordinator-frame";
import { UserRole } from "@/interfaces/session";
import { saveLanguage } from "@/lib/client/auth";
import { Locale, LOCALE_COOKIE } from "@/lib/i18n";
import { renderWithQueryClient } from "@test/test-utils";

let role = UserRole.Admin;
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ refresh, replace: vi.fn() }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({
    userId: "u1",
    fullName: "Test User",
    email: "user@example.test",
    role,
  }),
  useSession: () => ({ isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/components/common/notification-menu", () => ({
  NotificationMenu: () => null,
}));
vi.mock("@/hooks/use-password-reset", () => ({
  usePasswordReset: () => ({
    isSendingReset: false,
    sendPasswordReset: vi.fn(),
  }),
}));
vi.mock("@/lib/i18n", async (original) => ({
  ...(await original<typeof import("@/lib/i18n")>()),
  ENGLISH_ENABLED: true,
}));
vi.mock("@/lib/client/auth", () => ({
  saveLanguage: vi.fn().mockResolvedValue(undefined),
}));
beforeEach(() => {
  vi.clearAllMocks();
  document.cookie = `${LOCALE_COOKIE}=; max-age=0; path=/`;
});
it.each([UserRole.Admin, UserRole.Coordinator])(
  "lets %s change language from account settings",
  async (value) => {
    role = value;
    const Frame = role === UserRole.Admin ? AdminFrame : CoordinatorFrame;
    const user = userEvent.setup();
    renderWithQueryClient(
      <Frame>
        <p>Content</p>
      </Frame>,
    );
    await user.click(screen.getByRole("button", { name: /Test User/ }));
    await user.click(screen.getByRole("menuitem", { name: "Hesap ayarları" }));
    expect(
      screen.getByRole("dialog", { name: "Hesap ayarları" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(document.cookie).toContain(`${LOCALE_COOKIE}=en`);
    expect(saveLanguage).toHaveBeenCalledWith(Locale.En);
    expect(refresh).toHaveBeenCalled();
  },
);
