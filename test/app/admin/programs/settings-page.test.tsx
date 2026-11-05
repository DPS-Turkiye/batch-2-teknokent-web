import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminProgramSettingsPage from "@/app/admin/programs/[id]/settings/page";

vi.mock("@/components/coordinator/program-settings-view", () => ({
  ProgramSettingsView: ({ programId }: { programId: string }) => (
    <p>ProgramSettingsView {programId}</p>
  ),
}));

describe("admin Program Ayarları route", () => {
  it("opens the shared Program Ayarları screen for the program in the URL", async () => {
    render(
      await AdminProgramSettingsPage({
        params: Promise.resolve({ id: "program-1" }),
      }),
    );
    expect(
      screen.getByText("ProgramSettingsView program-1"),
    ).toBeInTheDocument();
  });
});
