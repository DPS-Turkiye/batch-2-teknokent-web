import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingAnnouncements } from "@/components/landing/landing-announcements";
import { LandingFooter } from "@/components/landing/landing-footer";
import { SUPPORT_EMAIL } from "@/lib/const";
import { InLocale } from "@test/test-utils";

describe("landing links", () => {
  it("sends every footer link somewhere, never just back to the top", () => {
    render(
      <InLocale locale="tr">
        <LandingFooter action={{ label: "Giriş yap", href: "/login" }} />
      </InLocale>,
    );

    const footer = screen.getByRole("contentinfo");
    const links = within(footer).getAllByRole("link");
    expect(links.length).toBeGreaterThan(1);
    // Only the logo may go back to the top of the page.
    expect(
      links
        .filter((link) => link.getAttribute("href") === "#top")
        .map((link) => link.getAttribute("aria-label")),
    ).toEqual(["menton ana sayfa"]);
    expect(
      within(footer).getByRole("link", { name: "Yardım Merkezi" }),
    ).toHaveAttribute("href", `mailto:${SUPPORT_EMAIL}`);
    expect(
      within(footer).getByRole("link", { name: "İletişim" }),
    ).toHaveAttribute("href", `mailto:${SUPPORT_EMAIL}`);
    expect(
      within(footer).queryByRole("link", { name: "KVKK" }),
    ).not.toBeInTheDocument();
  });

  it("opens the announcements in Mesajlar from Tüm duyurular and each card", () => {
    render(
      <InLocale locale="tr">
        <LandingAnnouncements />
      </InLocale>,
    );

    expect(
      screen.getByRole("link", { name: /Tüm duyuruları görüntüle/ }),
    ).toHaveAttribute("href", "/messages");
    const details = screen.getAllByRole("link", {
      name: /Detayları görüntüle/,
    });
    expect(details.length).toBeGreaterThan(0);
    details.forEach((link) =>
      expect(link).toHaveAttribute("href", "/messages"),
    );
  });
});
