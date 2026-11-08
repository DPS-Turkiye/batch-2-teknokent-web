import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramPeerCategories } from "@/components/coordinator/program-peer-categories-section";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  getProgramPeerCategories,
  replaceProgramPeerCategories,
} from "@/lib/client/program-peer-categories";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-peer-categories", () => ({
  getProgramPeerCategories: vi.fn(),
  replaceProgramPeerCategories: vi.fn(),
}));

describe("ProgramPeerCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProgramPeerCategories).mockResolvedValue({
      programId: "p1",
      active: [],
    });
  });

  it("starts with every category off and says what that means", async () => {
    renderWithQueryClient(
      <ProgramPeerCategories programId="p1" readOnly={false} />,
    );

    expect(
      await screen.findByText(/Hiçbir kategori etkin değil/),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(8);
    for (const box of screen.getAllByRole("checkbox")) {
      expect(box).not.toBeChecked();
    }
    expect(
      screen.getByRole("button", { name: "Kategorileri kaydet" }),
    ).toBeDisabled();
  });

  it("saves the chosen set as a whole, in the board's order", async () => {
    vi.mocked(replaceProgramPeerCategories).mockResolvedValue({
      programId: "p1",
      active: [
        PeerTopicCategory.CareerInternship,
        PeerTopicCategory.International,
      ],
    });
    const user = userEvent.setup();
    renderWithQueryClient(
      <ProgramPeerCategories programId="p1" readOnly={false} />,
    );

    await user.click(
      await screen.findByRole("checkbox", { name: "Uluslararası Fırsatlar" }),
    );
    await user.click(screen.getByRole("checkbox", { name: "Kariyer ve Staj" }));
    expect(screen.getByText("2 kategori etkin")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Kategorileri kaydet" }),
    );

    expect(replaceProgramPeerCategories).toHaveBeenCalledWith("p1", [
      PeerTopicCategory.CareerInternship,
      PeerTopicCategory.International,
    ]);
    expect(
      await screen.findByText("Kategoriler kaydedildi."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kategorileri kaydet" }),
    ).toBeDisabled();
  });

  it("drops unsaved changes on Vazgeç", async () => {
    vi.mocked(getProgramPeerCategories).mockResolvedValue({
      programId: "p1",
      active: [PeerTopicCategory.CampusLife],
    });
    const user = userEvent.setup();
    renderWithQueryClient(
      <ProgramPeerCategories programId="p1" readOnly={false} />,
    );
    const campus = await screen.findByRole("checkbox", {
      name: "Üniversite ve Kampüs Yaşamı",
    });
    expect(campus).toBeChecked();

    await user.click(campus);
    expect(campus).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));
    expect(campus).toBeChecked();
    expect(replaceProgramPeerCategories).not.toHaveBeenCalled();
  });

  it("shows the admin the set without letting them change it", async () => {
    vi.mocked(getProgramPeerCategories).mockResolvedValue({
      programId: "p1",
      active: [PeerTopicCategory.TechnicalDigital],
    });
    renderWithQueryClient(<ProgramPeerCategories programId="p1" readOnly />);

    expect(
      await screen.findByRole("checkbox", {
        name: "Teknik ve Dijital Beceriler",
      }),
    ).toBeChecked();
    for (const box of screen.getAllByRole("checkbox")) {
      expect(box).toBeDisabled();
    }
    expect(
      screen.queryByRole("button", { name: "Kategorileri kaydet" }),
    ).not.toBeInTheDocument();
  });
});
