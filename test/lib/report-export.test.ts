import { describe, expect, it } from "vitest";

import { SessionsExportFormat } from "@/interfaces/program-report";
import {
  attendanceExportFilename,
  sessionsExportFilename,
} from "@/lib/report-export";

describe("report file names", () => {
  it("names the sessions file after its days and format", () => {
    expect(
      sessionsExportFilename(
        { from: "2026-11-01", to: "2026-11-30" },
        SessionsExportFormat.Csv,
      ),
    ).toBe("gorusmeler-2026-11-01-2026-11-30.csv");
  });

  it("names the attendance file after its days, or the whole program", () => {
    expect(
      attendanceExportFilename(
        { from: "2026-11-09", to: "2026-11-12" },
        SessionsExportFormat.Xlsx,
      ),
    ).toBe("katilim-2026-11-09-2026-11-12.xlsx");
    expect(attendanceExportFilename(null, SessionsExportFormat.Csv)).toBe(
      "katilim-tum.csv",
    );
  });
});
