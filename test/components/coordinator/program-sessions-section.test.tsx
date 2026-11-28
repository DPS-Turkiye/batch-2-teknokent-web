import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramSessionsSection } from "@/components/coordinator/program-sessions-section";
import { SessionsExportFormat } from "@/interfaces/program-report";
import {
  downloadProgramSessions,
  getProgramSessions,
} from "@/lib/client/program-report";
import { useToastStore } from "@/stores/toast-store";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-report", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/program-report")>()),
  getProgramSessions: vi.fn(),
  downloadProgramSessions: vi.fn(),
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
    await userEvent.setup().click(
      screen.getByRole("button", { name: "Excel (.xlsx) indir" }),
    );
    await waitFor(() =>
      expect(downloadProgramSessions).toHaveBeenCalledWith("program-1", {
        from: "2026-11-01",
        to: "2026-11-30",
        format: SessionsExportFormat.Xlsx,
      }),
    );
  });

  it("says so when the file cannot be prepared", async () => {
    vi.mocked(downloadProgramSessions).mockRejectedValue(new Error("down"));
    renderWithQueryClient(<ProgramSessionsSection programId="program-1" />);
    await screen.findByText("Zeynep Şahin");

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "CSV indir" }));

    await waitFor(() =>
      expect(
        useToastStore.getState().toasts.map((toast) => toast.message),
      ).toContain("down"),
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
    expect(screen.getByRole("button", { name: "CSV indir" })).toBeDisabled();
  });
});
