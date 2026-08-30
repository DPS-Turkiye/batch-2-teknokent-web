import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "@/components/site-header";
import { SITE_NAV_ITEMS } from "@/lib/const";

describe("SiteHeader", () => {
  it("renders navigation items and action links", () => {
    render(<SiteHeader />);

    SITE_NAV_ITEMS.forEach((item) => {
      const el = screen.getAllByText(item.label)[0];
      expect(el).toBeInTheDocument();
      const anchor = el.closest("a");
      expect(anchor).toHaveAttribute("href", item.href);
    });

    const signIn = screen.getAllByText("Giriş Yap");
    expect(signIn.length).toBeGreaterThanOrEqual(1);
    expect(signIn[0].closest("a")).toHaveAttribute("href", "/login");

    const signUp = screen.getAllByText("Kayıt Ol");
    expect(signUp.length).toBeGreaterThanOrEqual(1);
    expect(signUp[0].closest("a")).toHaveAttribute("href", "/login");
  });
});
