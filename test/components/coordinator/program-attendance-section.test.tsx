import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramAttendanceSection } from "@/components/coordinator/program-attendance-section";
import { getProgramAttendance } from "@/lib/client/program-attendance";
import { attendanceReport } from "@test/fixtures/program-attendance";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-attendance", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/program-attendance")>()),
  getProgramAttendance: vi.fn(),
}));

describe("ProgramAttendanceSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProgramAttendance).mockResolvedValue(attendanceReport());
  });

  it("shows each participant per week with each week's rate", async () => {
    renderWithQueryClient(<ProgramAttendanceSection programId="program-1" />);

    const table = await screen.findByRole("table");
    expect(getProgramAttendance).toHaveBeenCalledWith("program-1", null);
    expect(within(table).getByText("H1")).toBeInTheDocument();
    expect(within(table).getByText("H2")).toBeInTheDocument();
    const gulse = within(table).getByText("Gülse Buran").closest("tr")!;
    expect(within(gulse).getByText("Katıldı")).toBeInTheDocument();
    expect(within(gulse).getByText("Katılmadı")).toBeInTheDocument();
    expect(
      within(table).getByRole("rowheader", { name: "Gülse Buran" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: /H2/ }),
    ).toHaveTextContent("9 Kas");
    expect(gulse).toHaveTextContent("1/2");
    const rates = within(table)
      .getByText("Haftalık katılım oranı")
      .closest("tr")!;
    expect(rates).toHaveTextContent("%0");
    expect(rates).toHaveTextContent("%50");
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

  it("says when no week has begun", async () => {
    vi.mocked(getProgramAttendance).mockResolvedValue(
      attendanceReport({ weeks: [], participants: [] }),
    );

    renderWithQueryClient(<ProgramAttendanceSection programId="program-1" />);

    expect(
      await screen.findByText("Bu aralıkta başlamış bir program haftası yok."),
    ).toBeInTheDocument();
  });
});
