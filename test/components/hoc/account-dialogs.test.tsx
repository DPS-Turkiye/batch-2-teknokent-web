import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountSettingsDialog,
  NotificationPreferencesDialog,
} from "@/components/hoc/account-dialogs";
import { type AppSession, UserRole } from "@/interfaces/session";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/client/notifications";
import { requestPasswordReset } from "@/lib/firebase/auth";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

let session: Partial<AppSession>;
let englishEnabled = false;

vi.mock("@/lib/i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/i18n")>()),
  get ENGLISH_ENABLED() {
    return englishEnabled;
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => session,
  useSession: () => ({ session }),
}));
vi.mock("@/lib/firebase/auth", () => ({ requestPasswordReset: vi.fn() }));
vi.mock("@/lib/client/notifications", () => ({
  getNotificationPreferences: vi.fn(),
  saveNotificationPreferences: vi.fn(),
}));

const preferences = {
  messages: true,
  meetingReminders: true,
  meetingChanges: true,
  newTasks: false,
  taskDeadlines: true,
  startupActivity: true,
};

describe("AccountSettingsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    englishEnabled = false;
    session = { email: "gulse@dongu.app", role: UserRole.Mentee };
  });

  it("offers the language switch only once English is on, and reads in English", () => {
    const { unmount } = renderWithQueryClient(
      <AccountSettingsDialog onClose={vi.fn()} />,
    );
    expect(
      screen.queryByRole("group", { name: "Dil" }),
    ).not.toBeInTheDocument();
    unmount();

    englishEnabled = true;
    renderWithQueryClient(
      <InLocale locale="en">
        <AccountSettingsDialog onClose={vi.fn()} />
      </InLocale>,
    );
    expect(
      screen.getByRole("dialog", { name: "Account settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset my password" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the e-mail, sends a reset link to it and links to the personal profile", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);
    renderWithQueryClient(<AccountSettingsDialog onClose={onClose} />);

    expect(
      screen.getByRole("dialog", { name: "Hesap ayarları" }),
    ).toBeInTheDocument();
    expect(screen.getByText("gulse@dongu.app")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Şifremi sıfırla" }));
    expect(requestPasswordReset).toHaveBeenCalledWith("gulse@dongu.app");
    expect(
      await screen.findByText(
        "Şifre sıfırlama bağlantısı e-postana gönderildi.",
      ),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: "Kişisel bilgileri düzenle →",
    });
    expect(link).toHaveAttribute("href", "/profile/personal");
    await user.click(screen.getByRole("button", { name: "Kapat" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("sends a mentor to the mentor profile and gives a coordinator no profile link", () => {
    session = { email: "mentor@example.com", role: UserRole.Mentor };
    const { unmount } = renderWithQueryClient(
      <AccountSettingsDialog onClose={vi.fn()} />,
    );
    expect(
      screen.getByRole("link", { name: "Kişisel bilgileri düzenle →" }),
    ).toHaveAttribute("href", "/mentor-profile");
    unmount();

    session = { email: "koord@example.com", role: UserRole.Coordinator };
    renderWithQueryClient(<AccountSettingsDialog onClose={vi.fn()} />);
    expect(
      screen.queryByRole("link", { name: "Kişisel bilgileri düzenle →" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Şifremi sıfırla" }),
    ).toBeInTheDocument();
  });
});

describe("NotificationPreferencesDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session = { email: "gulse@dongu.app", role: UserRole.Mentee };
  });

  it("lists the role's switches and saves a flipped one", async () => {
    const user = userEvent.setup();
    vi.mocked(getNotificationPreferences).mockResolvedValue(preferences);
    vi.mocked(saveNotificationPreferences).mockImplementation(
      async (next) => next,
    );
    renderWithQueryClient(<NotificationPreferencesDialog onClose={vi.fn()} />);

    const tasks = await screen.findByRole("switch", {
      name: "Yeni görev atandığında",
    });
    expect(screen.getAllByRole("switch")).toHaveLength(4);
    expect(tasks).toHaveAttribute("aria-checked", "false");

    await user.click(tasks);

    expect(saveNotificationPreferences).toHaveBeenCalledWith(
      { ...preferences, newTasks: true },
      expect.anything(),
    );
    expect(tasks).toHaveAttribute("aria-checked", "true");
  });

  it("names a mentor's switches and hints in English", async () => {
    session = { email: "mentor@example.com", role: UserRole.Mentor };
    vi.mocked(getNotificationPreferences).mockResolvedValue(preferences);
    renderWithQueryClient(
      <InLocale locale="en">
        <NotificationPreferencesDialog onClose={vi.fn()} />
      </InLocale>,
    );

    expect(
      await screen.findByRole("switch", { name: "Startup activity" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("file uploads, completed tasks"),
    ).toBeInTheDocument();
    expect(screen.getByText("Meeting changes")).toBeInTheDocument();
  });

  it("says when the switches cannot be loaded", async () => {
    vi.mocked(getNotificationPreferences).mockRejectedValue(new Error("down"));
    renderWithQueryClient(<NotificationPreferencesDialog onClose={vi.fn()} />);

    expect(
      await screen.findByText("Bildirim ayarları yüklenemedi."),
    ).toBeInTheDocument();
  });
});
