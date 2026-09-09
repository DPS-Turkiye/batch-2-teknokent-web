import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/site-footer";

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ isLoading: false, session: null }),
}));

describe("SiteFooter", () => {
  it("uses real section and contact destinations instead of empty anchors", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Programlar" })).toHaveAttribute(
      "href",
      "/#programlar",
    );
    expect(screen.getByRole("link", { name: "İletişim" })).toHaveAttribute(
      "href",
      "mailto:info@metu.edu.tr",
    );
    expect(document.querySelector('a[href="#"]')).toBeNull();
    expect(screen.getByText("Gizlilik").closest("a")).toBeNull();
  });
});
