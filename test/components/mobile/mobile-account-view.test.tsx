import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileAccountView } from "@/components/mobile/mobile-account-view";
import type { useMobileAccount } from "@/hooks/use-mobile-account";
import { PushDeviceState } from "@/hooks/use-push-device";
import { preferenceRowsFor } from "@/lib/mobile-account";

type Account = ReturnType<typeof useMobileAccount>;

const toggle = vi.fn();
const signOut = vi.fn();
const enable = vi.fn();
let account: Account;

vi.mock("@/hooks/use-mobile-account", () => ({
  useMobileAccount: () => account,
}));

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
