import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminProgramPage from "@/app/admin/programs/[id]/page";

vi.mock("@/components/coordinator/program-overview-view", () => ({
  ProgramOverviewView: ({ programId }: { programId: string }) => (
    <p>ProgramOverviewView {programId}</p>
  ),
}));

describe("admin program Genel Bakış route", () => {
  it("opens the shared overview for the program in the URL", async () => {
    render(
      await AdminProgramPage({ params: Promise.resolve({ id: "program-1" }) }),
    );
    expect(
      screen.getByText("ProgramOverviewView program-1"),
    ).toBeInTheDocument();
  });
});
