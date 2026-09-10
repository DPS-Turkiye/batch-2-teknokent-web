import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MentorProfilePage from "@/app/mentor-profile/page";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("MentorProfilePage", () => {
  it("renders the mentor identity header", () => {
    renderWithQueryClient(<MentorProfilePage />);

    expect(
      screen.getByRole("heading", { name: "Nihan Öztürk" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Design / UX Mentor · 12 yıl ürün tasarımı deneyimi"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mentorluğa açık")).toBeInTheDocument();
  });

  it("summarises the mentor's mentorship statistics", () => {
    renderWithQueryClient(<MentorProfilePage />);

    expect(screen.getByText("Aktif mentorluk")).toBeInTheDocument();
    expect(screen.getByText("Tamamlanan")).toBeInTheDocument();
    expect(screen.getByText("Ortalama değerlendirme")).toBeInTheDocument();
  });

  it("renders the availability, preference and programme cards", () => {
    renderWithQueryClient(<MentorProfilePage />);

    expect(
      screen.getByRole("heading", { name: "Müsaitlik" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Görüşme tercihleri" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Programlar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tekrarlayan haftalık uygunluk"),
    ).toBeInTheDocument();
  });

  it("opens the availability editor", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorProfilePage />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Müsaitliği düzenle" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Müsaitliği düzenle" });
    expect(within(dialog).getByText("Haftalık uygunluk")).toBeInTheDocument();
  });

  it("dismisses the availability editor from its close button", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorProfilePage />);

    await user.click(
      screen.getByRole("button", { name: "Müsaitliği düzenle" }),
    );
    await user.click(screen.getByRole("button", { name: "Kapat" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses the availability editor from Vazgeç", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorProfilePage />);

    await user.click(
      screen.getByRole("button", { name: "Müsaitliği düzenle" }),
    );
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // The editor is still presentation-only: Kaydet closes the dialog and does
  // not persist anything until the availability API is wired up.
  it("closes the availability editor from Kaydet without persisting", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorProfilePage />);

    await user.click(
      screen.getByRole("button", { name: "Müsaitliği düzenle" }),
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
