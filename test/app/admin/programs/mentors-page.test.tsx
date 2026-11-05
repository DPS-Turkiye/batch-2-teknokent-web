import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminProgramMentorsPage from "@/app/admin/programs/[id]/mentors/page";

vi.mock("@/components/coordinator/program-mentors-view", () => ({
  ProgramMentorsView: ({ programId }: { programId: string }) => (
    <p>ProgramMentorsView {programId}</p>
  ),
}));

describe("admin Mentor Havuzu route", () => {
  it("opens the shared Mentor Havuzu screen for the program in the URL", async () => {
    render(
      await AdminProgramMentorsPage({
        params: Promise.resolve({ id: "program-1" }),
      }),
    );
    expect(
      screen.getByText("ProgramMentorsView program-1"),
    ).toBeInTheDocument();
  });
});
