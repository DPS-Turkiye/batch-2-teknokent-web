import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramSessionsSection } from "@/components/coordinator/program-sessions-section";
import { getProgramSessions } from "@/lib/client/program-report";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-report", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/program-report")>()),
  getProgramSessions: vi.fn(),
}));

describe("ProgramSessionsSection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 7, 12) });
    vi.mocked(getProgramSessions).mockResolvedValue({
      programId: "program-1",
      from: "2026-11-01",
      to: "2026-11-30",
      mentors: [
        {
          id: "mentor-1",
          name: "Zeynep Şahin",
          email: "zeynep@example.edu.tr",
          sessions: 3,
          minutes: 90,
          days: 2,
        },
      ],
      students: [],
    });
  });

  afterEach(() => vi.useRealTimers());

  it("starts on the current month and lists each mentor's sessions, hours and days", async () => {
    renderWithQueryClient(<ProgramSessionsSection programId="program-1" />);

    expect(await screen.findByText("Zeynep Şahin")).toBeInTheDocument();
    expect(getProgramSessions).toHaveBeenCalledWith(
      "program-1",
      "2026-11-01",
      "2026-11-30",
    );
    expect(screen.getByText("1,5")).toBeInTheDocument();
    expect(
      screen.getByText("Bu aralıkta onaylanmış görüşme yok."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Excel (.xlsx) indir" }),
    ).toHaveAttribute(
      "href",
      "/api/coordinator/programs/program-1/sessions/export?from=2026-11-01&to=2026-11-30&format=XLSX",
    );
    expect(screen.getByRole("link", { name: "CSV indir" })).toHaveAttribute(
      "href",
      expect.stringContaining("format=CSV"),
    );
  });

  it("stops at a range that ends before it starts", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramSessionsSection programId="program-1" />);
    await screen.findByText("Zeynep Şahin");

    const to = screen.getByLabelText("Bitiş");
    await user.clear(to);
    await user.type(to, "2026-10-01");

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Bitiş tarihi başlangıçtan önce olamaz.",
      ),
    );
    expect(screen.getByText("CSV indir")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
