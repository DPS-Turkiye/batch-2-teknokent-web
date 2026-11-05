import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "@/components/hoc/account-menu";

const onOpenSettings = vi.fn();
const onOpenNotifications = vi.fn();
const onLogout = vi.fn();

function renderMenu(
  overrides: Partial<Parameters<typeof AccountMenu>[0]> = {},
) {
  return render(
    <div>
      <p>page content</p>
      <AccountMenu
        displayName="Gülse Buran"
        subtitle="Döngü"
        email="gulse@dongu.app"
        initials="GB"
        photoUrl={null}
        profileHref="/profile/personal"
        showName={false}
        onOpenSettings={onOpenSettings}
        onOpenNotifications={onOpenNotifications}
        onLogout={onLogout}
        {...overrides}
      />
    </div>,
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Hesap menüsünü aç/ }));
  return screen.getByRole("menu", { name: "Hesap menüsü" });
}

describe("AccountMenu", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the person and every account action", async () => {
    const user = userEvent.setup();
    renderMenu();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await openMenu(user);

    expect(screen.getByText("Gülse Buran")).toBeInTheDocument();
    expect(screen.getByText("gulse@dongu.app")).toBeInTheDocument();
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual([
      "Profilim",
      "Hesap ayarları",
      "Bildirim tercihleri",
      "Yardım & destek",
      "Çıkış yap",
    ]);
    expect(screen.getByRole("menuitem", { name: "Profilim" })).toHaveAttribute(
      "href",
      "/profile/personal",
    );
  });

  it("opens the settings and notification dialogs, closing the menu and keeping focus on the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", { name: /Hesap menüsünü aç/ });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Hesap ayarları" }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await openMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: "Bildirim tercihleri" }),
    );
    expect(onOpenNotifications).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens Help and Support addressed to the Menton team inbox", async () => {
    const user = userEvent.setup();
    renderMenu();

    await openMenu(user);

    expect(
      screen.getByRole("menuitem", { name: "Yardım & destek" }),
    ).toHaveAttribute("href", "mailto:info@menton.com.tr");
  });

  it("asks to log out", async () => {
    const user = userEvent.setup();
    renderMenu();

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Çıkış yap" }));

    expect(onLogout).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape and on a click outside", async () => {
    const user = userEvent.setup();
    renderMenu();

    await openMenu(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await openMenu(user);
    await user.click(screen.getByText("page content"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("moves focus with the arrow, Home and End keys and returns it on Escape", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", {
      name: "Gülse Buran · Hesap menüsünü aç",
    });

    await openMenu(user);
    const item = (name: string) => screen.getByRole("menuitem", { name });
    expect(item("Profilim")).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(item("Hesap ayarları")).toHaveFocus();
    await user.keyboard("{End}");
    expect(item("Çıkış yap")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("Profilim")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Çıkış yap")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(item("Profilim")).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("shows the photo without announcing it twice, and the name on the older navigation", () => {
    const { container } = renderMenu({
      photoUrl: "https://files.example/me.png",
      showName: true,
    });

    expect(
      screen.getByRole("button", { name: "Gülse Buran · Hesap menüsünü aç" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      container.querySelector('[style*="files.example/me.png"]'),
    ).not.toBeNull();
    expect(screen.getByText("Döngü")).toBeInTheDocument();
  });
});
