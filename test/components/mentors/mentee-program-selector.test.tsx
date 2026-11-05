import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MenteeProgramSelector } from "@/components/mentors/mentee-program-selector";
import { MENTORS_QUERY_KEY } from "@/hooks/use-mentors";
import type { OrganizationPrograms } from "@/interfaces/program";
import {
  getOrganizationPrograms,
  setActiveProgram,
} from "@/lib/client/programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/programs", () => ({
  getOrganizationPrograms: vi.fn(),
  setActiveProgram: vi.fn(),
}));

const alpha = { id: "p-1", name: "Alpha 2026", coordinatorName: "Elif" };
const beta = { id: "p-2", name: "Beta 2026", coordinatorName: "Burcu" };

function programs(
  list = [alpha, beta],
  activeProgramId: string | null = null,
): OrganizationPrograms {
  return { programs: list, activeProgramId };
}

describe("MenteeProgramSelector", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stays hidden for a startup in one program", async () => {
    vi.mocked(getOrganizationPrograms).mockResolvedValue(programs([alpha]));
    renderWithQueryClient(<MenteeProgramSelector />);
    await waitFor(() => expect(getOrganizationPrograms).toHaveBeenCalled());
    expect(screen.queryByLabelText("Program")).not.toBeInTheDocument();
  });

  it("starts on the last program joined when none is chosen", async () => {
    vi.mocked(getOrganizationPrograms).mockResolvedValue(programs());
    renderWithQueryClient(<MenteeProgramSelector />);
    expect(await screen.findByLabelText("Program")).toHaveValue("p-2");
    expect(
      screen.getByText(/Seçim tüm ekibin için geçerlidir/),
    ).toBeInTheDocument();
  });

  it("switches the program and refreshes the mentor pool", async () => {
    vi.mocked(getOrganizationPrograms).mockResolvedValue(programs());
    vi.mocked(setActiveProgram).mockResolvedValue(programs(undefined, "p-1"));
    const { queryClient } = renderWithQueryClient(<MenteeProgramSelector />);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await userEvent.selectOptions(
      await screen.findByLabelText("Program"),
      "p-1",
    );

    expect(vi.mocked(setActiveProgram).mock.calls[0]?.[0]).toBe("p-1");
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: MENTORS_QUERY_KEY }),
    );
    expect(
      await screen.findByText(
        "Mentor havuzu artık Alpha 2026 programına göre gösteriliyor.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Program")).toHaveValue("p-1");
  });

  it("says so when the switch is refused", async () => {
    vi.mocked(getOrganizationPrograms).mockResolvedValue(programs());
    vi.mocked(setActiveProgram).mockRejectedValue(
      new Error("Your startup has not been added to this program."),
    );
    renderWithQueryClient(<MenteeProgramSelector />);

    await userEvent.selectOptions(
      await screen.findByLabelText("Program"),
      "p-1",
    );

    expect(
      await screen.findByText(
        "Your startup has not been added to this program.",
      ),
    ).toBeInTheDocument();
  });

  it("reads in English", async () => {
    vi.mocked(getOrganizationPrograms).mockResolvedValue(programs());
    renderWithQueryClient(
      <InLocale locale="en">
        <MenteeProgramSelector />
      </InLocale>,
    );
    expect(await screen.findByLabelText("Program")).toBeInTheDocument();
    expect(
      screen.getByText(/The choice applies to your whole team/),
    ).toBeInTheDocument();
  });
});
