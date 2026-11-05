import { screen } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { ProgramWithoutTeam } from "@/components/coordinator/program-without-team";
import { getProgramWithoutTeam } from "@/lib/client/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";
vi.mock("@/lib/client/coordinator-programs", () => ({
  getProgramWithoutTeam: vi.fn(),
}));
it("lists approved people without a startup and exposes their history", async () => {
  vi.mocked(getProgramWithoutTeam).mockResolvedValue([
    {
      id: "u1",
      fullName: "Ada Test",
      email: "ada@example.test",
      jobTitle: null,
    },
  ]);
  renderWithQueryClient(<ProgramWithoutTeam programId="p1" />);
  expect(await screen.findByText("Ada Test")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Takım geçmişi" }),
  ).toBeInTheDocument();
});
