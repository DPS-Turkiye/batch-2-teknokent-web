import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileAccountView } from "@/components/mobile/mobile-account-view";
import type { useMobileAccount } from "@/hooks/use-mobile-account";
import { PushDeviceState } from "@/hooks/use-push-device";
import { preferenceRowsFor } from "@/lib/mobile-account";
import { InLocale } from "@test/test-utils";

type Account = ReturnType<typeof useMobileAccount>;

const toggle = vi.fn();
const signOut = vi.fn();
const enable = vi.fn();
let account: Account;
let englishEnabled = false;

vi.mock("@/hooks/use-mobile-account", () => ({
  useMobileAccount: () => account,
}));

vi.mock("@/lib/i18n", async (original) => ({
  ...(await original<typeof import("@/lib/i18n")>()),
  get ENGLISH_ENABLED() {
    return englishEnabled;
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("next/link", () => import("@test/mocks/next-link"));

function accountState(overrides: Partial<Account> = {}): Account {
  return {
    avatarClass: "",
    backHref: "/m",
    chip: "Atlas AI · Takım yetkilisi",
    email: "gamze@atlasai.co",
    fullName: "Gamze Kozak",
    initials: "GK",
    isSigningOut: false,
    preferences: {
      messages: true,
      meetingReminders: true,
      meetingChanges: true,
      newTasks: true,
      taskDeadlines: false,
      startupActivity: true,
    },
    preferencesError: false,
    preferencesLoading: false,
    push: {
      state: PushDeviceState.Off,
      enable,
      isEnabling: false,
      failed: false,
    },
    rows: preferenceRowsFor(),
    saveFailed: false,
    signOut,
    toggle,
    webEdit: {
      title: "Profil bilgilerini düzenle",
      hint: "Profil, startup ve dosyalar web üzerinden düzenlenir.",
      href: "/profile?web=1",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  englishEnabled = false;
  account = accountState();
});

describe("MobileAccountView", () => {
  it("shows the person and a switch per notification type", () => {
    render(<MobileAccountView />);

    expect(screen.getByText("Gamze Kozak")).toBeInTheDocument();
    expect(screen.getByText("Atlas AI · Takım yetkilisi")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Mesajlar" })).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Görev son tarihi" }),
    ).not.toBeChecked();
  });

  it("labels the switches, push row and sign-out in English", () => {
    render(
      <InLocale locale="en">
        <MobileAccountView />
      </InLocale>,
    );

    expect(screen.getByRole("heading", { name: "Account" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to home" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Messages" })).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Task due date" }),
    ).not.toBeChecked();
    expect(screen.getByText("1 day before")).toBeInTheDocument();
    expect(
      screen.getByText("Notifications on this device"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Get instant notifications on your phone."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Turn on" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open on Web" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  it("flips a switch", async () => {
    render(<MobileAccountView />);

    await userEvent.click(
      screen.getByRole("switch", { name: "Görev son tarihi" }),
    );

    expect(toggle).toHaveBeenCalledWith("taskDeadlines");
  });

  it("turns on push for this phone", async () => {
    render(<MobileAccountView />);

    await userEvent.click(screen.getByRole("button", { name: "Aç" }));

    expect(enable).toHaveBeenCalled();
  });

  it("tells iPhone users to add the app first", () => {
    account = accountState({
      push: {
        state: PushDeviceState.NeedsInstall,
        enable,
        isEnabling: false,
        failed: false,
      },
    });
    render(<MobileAccountView />);

    expect(screen.getByText(/Ana Ekrana Ekle/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aç" })).toBeNull();
  });

  it("links profile editing to the web", () => {
    render(<MobileAccountView />);

    const webLink = screen.getByRole("link", { name: "Web’de Aç" });
    expect(webLink).toHaveAttribute("href", "/profile?web=1");
    expect(webLink).not.toHaveAttribute("data-next-link");
  });

  it("signs out", async () => {
    render(<MobileAccountView />);

    await userEvent.click(screen.getByRole("button", { name: "Çıkış yap" }));

    expect(signOut).toHaveBeenCalled();
  });

  it("reports a switch that could not be saved", () => {
    account = accountState({ saveFailed: true });
    render(<MobileAccountView />);

    expect(screen.getByRole("alert")).toHaveTextContent("Ayar kaydedilemedi.");
  });
});

it("offers language selection in mobile account preferences when enabled", () => {
  englishEnabled = true;
  render(<MobileAccountView />);
  expect(screen.getByRole("group", { name: "Dil" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
});
