import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "@/components/hoc/account-menu";

const onComingSoon = vi.fn();
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
        onComingSoon={onComingSoon}
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

  it("reports the actions without a page yet and closes", async () => {
    const user = userEvent.setup();
    renderMenu();

    for (const name of [
      "Hesap ayarları",
      "Bildirim tercihleri",
      "Yardım & destek",
    ]) {
      await openMenu(user);
      await user.click(screen.getByRole("menuitem", { name }));
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    }
    expect(onComingSoon).toHaveBeenCalledTimes(3);
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

  it("shows the photo and, on the older navigation, the name", () => {
    renderMenu({ photoUrl: "https://files.example/me.png", showName: true });

    expect(
      screen.getByRole("img", { name: "Profil fotoğrafı" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Döngü")).toBeInTheDocument();
  });
});
