import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

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
      organizationName: null,
      createdAt: "2026-09-01T09:00:00Z",
    },
  ]);
  renderWithQueryClient(<ProgramWithoutTeam programId="p1" />);
  expect(await screen.findByText("Ada Test")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Takım geçmişi" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Profili gör: Ada Test" }),
  ).toHaveAttribute("href", "/coordinator/people/u1");
});
