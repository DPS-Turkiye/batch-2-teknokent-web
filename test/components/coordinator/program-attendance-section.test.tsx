import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramAttendanceSection } from "@/components/coordinator/program-attendance-section";
import { AttendanceSessionKind } from "@/interfaces/program-attendance";
import {
  getProgramAttendance,
  markSessionAttendance,
  unmarkSessionAttendance,
} from "@/lib/client/program-attendance";
import { attendanceReport } from "@test/fixtures/program-attendance";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/program-attendance")>()),
  getProgramAttendance: vi.fn(),
  markSessionAttendance: vi.fn(),
  unmarkSessionAttendance: vi.fn(),
}));

function rowOf(table: HTMLElement, name: string) {
  const row = within(table).getByText(name).closest("tr");
  if (!row) throw new Error(`no row for ${name}`);
  return row;
}

describe("ProgramAttendanceSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProgramAttendance).mockResolvedValue(attendanceReport());
    vi.mocked(markSessionAttendance).mockResolvedValue(null);
    vi.mocked(unmarkSessionAttendance).mockResolvedValue(null);
  });

  it("shows each participant per session, how they attended, and each session's rate", async () => {
    renderWithQueryClient(<ProgramAttendanceSection programId="program-1" />);

    const table = await screen.findByRole("table");
    expect(getProgramAttendance).toHaveBeenCalledWith("program-1", null);
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Ad Soyad",
      "Takım",
      "H1Eğitim 2 Kas",
      "H1Haftalık (eski)",
      "H2Eğitim 9 Kas",
      "Katıldığı",
    ]);
    const gulse = rowOf(table, "Gülse Buran");
    expect(within(gulse).getByTitle("Haftalık işaret (eski)")).toBeVisible();
    expect(within(gulse).getByTitle("QR ile katıldı")).toBeVisible();
    expect(gulse).toHaveTextContent("2/3");
    const rates = rowOf(table, "Katılım oranı");
    expect(rates).toHaveTextContent("%0");
    expect(rates).toHaveTextContent("%50");
  });

  it("lets a coordinator mark or unmark a current participant at a lesson, not a weekly or former row", async () => {
    renderWithQueryClient(<ProgramAttendanceSection programId="program-1" />);
    const table = await screen.findByRole("table");
    const gulse = rowOf(table, "Gülse Buran");
    const mert = rowOf(table, "Mert Kaya");

    expect(within(gulse).getAllByRole("button")).toHaveLength(2);
    expect(within(mert).queryAllByRole("button")).toHaveLength(0);
    expect(within(mert).getByTitle("Koordinatör işaretledi")).toBeVisible();

    const lesson = within(gulse).getByRole("button", {
      name: "Gülse Buran, H1 Eğitim 2 Kas: katıldı",
    });
    expect(lesson).toHaveAttribute("aria-pressed", "false");
    lesson.focus();
    fireEvent.click(lesson);
    // The cell stays a button while the change is on its way, so keyboard focus stays on it.
    expect(lesson).toHaveFocus();
    await waitFor(() =>
      expect(markSessionAttendance).toHaveBeenCalledWith(
        "program-1",
        { week: 1, kind: AttendanceSessionKind.Lesson },
        "user-gulse",
      ),
    );
    const laterLesson = within(gulse).getByRole("button", {
      name: "Gülse Buran, H2 Eğitim 9 Kas: katıldı",
    });
    expect(laterLesson).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(laterLesson);
    await waitFor(() =>
      expect(unmarkSessionAttendance).toHaveBeenCalledWith(
        "program-1",
        { week: 2, kind: AttendanceSessionKind.Lesson },
        "user-gulse",
      ),
    );
  });

  it("says attendance is off and keeps the earlier records read-only", async () => {
    vi.mocked(getProgramAttendance).mockResolvedValue(
      attendanceReport({ attendanceEnabled: false }),
    );

    renderWithQueryClient(<ProgramAttendanceSection programId="program-1" />);

    expect(
      await screen.findByText(/Bu programda yoklama kapalı/),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("table")).queryAllByRole("button"),
    ).toHaveLength(0);
  });

  it("narrows to a date range and keeps the download links on it", async () => {
    renderWithQueryClient(<ProgramAttendanceSection programId="program-1" />);
    await screen.findByRole("table");

    fireEvent.change(screen.getByLabelText("Başlangıç"), {
      target: { value: "2026-11-09" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Geçerli bir tarih aralığı seçin.",
    );
    fireEvent.change(screen.getByLabelText("Bitiş"), {
      target: { value: "2026-11-12" },
    });

    await waitFor(() =>
      expect(getProgramAttendance).toHaveBeenLastCalledWith("program-1", {
        from: "2026-11-09",
        to: "2026-11-12",
      }),
    );
    expect(screen.getByRole("link", { name: "Excel indir" })).toHaveAttribute(
      "href",
      "/api/coordinator/programs/program-1/attendance/export?from=2026-11-09&to=2026-11-12&format=XLSX",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tüm program" }));
    expect(screen.getByRole("link", { name: "CSV indir" })).toHaveAttribute(
      "href",
      "/api/coordinator/programs/program-1/attendance/export?format=CSV",
    );
  });

  it("says when no session has taken place", async () => {
    vi.mocked(getProgramAttendance).mockResolvedValue(
      attendanceReport({ sessions: [], participants: [] }),
    );

    renderWithQueryClient(<ProgramAttendanceSection programId="program-1" />);

    expect(
      await screen.findByText("Bu aralıkta yapılmış bir oturum yok."),
    ).toBeInTheDocument();
  });
});
