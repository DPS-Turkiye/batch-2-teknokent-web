import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAcademicsTable } from "@/components/admin/admin-academics-table";
import { getAdminAcademics } from "@/lib/client/admin-academics";
import { ADMIN_ACADEMICS } from "@test/fixtures/admin-academics";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-academics", () => ({
  getAdminAcademics: vi.fn(),
}));

describe("AdminAcademicsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminAcademics).mockResolvedValue(ADMIN_ACADEMICS);
  });

  it("lists the institution's academicians with no approve action", async () => {
    renderWithQueryClient(<AdminAcademicsTable />);

    expect(await screen.findByText("Doç. Dr. Ali Demir")).toBeInTheDocument();
    expect(screen.getByText("Prof. Dr. Zeynep Kara")).toBeInTheDocument();
    expect(screen.getByText("Henüz giriş yapmadı")).toBeInTheDocument();
    expect(screen.getByText("Pasif")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Onayla/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tümü 3/ })).toBeInTheDocument();
  });

  it("filters by sign-in, department and search", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdminAcademicsTable />);
    await screen.findByText("Doç. Dr. Ali Demir");

    await user.click(
      screen.getByRole("button", { name: /Henüz giriş yapmadı 1/ }),
    );
    expect(screen.queryByText("Doç. Dr. Ali Demir")).not.toBeInTheDocument();
    expect(screen.getByText("Prof. Dr. Zeynep Kara")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tümü 3/ }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Bölüm" }),
      "Bilgisayar Mühendisliği",
    );
    expect(screen.queryByText("Prof. Dr. Zeynep Kara")).not.toBeInTheDocument();
    expect(screen.getByText("Mert Aydın")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Ad, e-posta/), "zzz");
    expect(
      screen.getByText("Bu filtrede akademisyen yok."),
    ).toBeInTheDocument();
  });

  it("opens a read-only drawer and closes it with Escape", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdminAcademicsTable />);
    await user.click(
      await screen.findByRole("button", { name: "Ayrıntılar: Ali Demir" }),
    );

    const drawer = screen.getByRole("dialog", {
      name: "Akademisyen: Ali Demir",
    });
    expect(
      within(drawer).getByText("Mühendislik Fakültesi"),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText("Bilgisayar Mühendisliği · CENG"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("3 danışan")).toBeInTheDocument();
    expect(
      within(drawer).getByText(/Office Hours etkinliği henüz/),
    ).toBeInTheDocument();
    expect(within(drawer).queryByRole("textbox")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says so when the institution lists nobody", async () => {
    vi.mocked(getAdminAcademics).mockResolvedValue([]);
    renderWithQueryClient(<AdminAcademicsTable />);
    expect(
      await screen.findByText("Kurum verisinde henüz akademisyen yok."),
    ).toBeInTheDocument();
  });
});
