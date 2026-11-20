import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChangeFounderButton } from "@/components/people/change-founder-dialog";
import {
  changeFounder,
  getFounderChangeOptions,
} from "@/lib/client/founder-change";
import {
  founderChangeOptions,
  founderChangeResult,
} from "@test/fixtures/founder-change";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/founder-change", () => ({
  getFounderChangeOptions: vi.fn(),
  changeFounder: vi.fn(),
}));

function show() {
  renderWithQueryClient(
    <ChangeFounderButton
      organizationId="org-1"
      programId="program-1"
      className=""
    />,
  );
  return userEvent.setup();
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Kurucuyu değiştir" }));
  return screen.findByRole("dialog", { name: "Kurucuyu değiştir" });
}

describe("ChangeFounderButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFounderChangeOptions).mockResolvedValue(
      founderChangeOptions(),
    );
    vi.mocked(changeFounder).mockResolvedValue(founderChangeResult());
  });

  it("names the founder now and lists the members who may take over", async () => {
    const user = show();
    const dialog = await open(user);

    expect(
      await within(dialog).findByText(
        "Yıldız Team girişiminin şu anki kurucusu: Merve Geçer",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog)
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("value")),
    ).toEqual(["member-2", "member-1"]);
    expect(
      within(dialog).getByRole("button", { name: "Kurucu yap" }),
    ).toBeDisabled();
    expect(getFounderChangeOptions).toHaveBeenCalledWith("org-1");
  });

  it("says what happens, then makes the chosen member the founder", async () => {
    const user = show();
    const dialog = await open(user);

    await user.click(
      await within(dialog).findByRole("radio", { name: /Zeynep Beyza/ }),
    );
    expect(
      within(dialog).getByText(
        "Zeynep Beyza Takkabulan, Yıldız Team girişiminin kurucusu olacak ve takımı yönetecek.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Merve Geçer takımda üye olarak kalır."),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "Kurucu yap" }),
    );

    expect(changeFounder).toHaveBeenCalledWith("org-1", "member-1");
    expect(
      await screen.findByText(
        "Zeynep Beyza Takkabulan artık Yıldız Team girişiminin kurucusu.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says so when nobody can take over, and for a startup without a founder", async () => {
    vi.mocked(getFounderChangeOptions).mockResolvedValue(
      founderChangeOptions({ currentFounder: null, candidates: [] }),
    );
    const user = show();
    const dialog = await open(user);

    expect(
      await within(dialog).findByText(
        "Kurucu yapılabilecek, hesabı onaylı başka bir üye yok.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Yıldız Team girişiminin şu an bir kurucusu yok.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the backend's refusal and keeps the dialog open", async () => {
    vi.mocked(changeFounder).mockRejectedValue(
      new Error("Ayrılma talebi bekleyen biri lider olarak seçilemez."),
    );
    const user = show();
    const dialog = await open(user);
    await user.click(
      await within(dialog).findByRole("radio", { name: /Zeynep Beyza/ }),
    );

    await user.click(
      within(dialog).getByRole("button", { name: "Kurucu yap" }),
    );

    expect(
      await screen.findByText(
        "Ayrılma talebi bekleyen biri lider olarak seçilemez.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows why the members could not be loaded", async () => {
    vi.mocked(getFounderChangeOptions).mockRejectedValue(
      new Error("Team not found"),
    );
    const user = show();
    const dialog = await open(user);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Team not found",
    );
  });

  it("closes on Vazgeç without changing anything", async () => {
    const user = show();
    const dialog = await open(user);
    await within(dialog).findAllByRole("radio");

    await user.click(within(dialog).getByRole("button", { name: "Vazgeç" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(changeFounder).not.toHaveBeenCalled();
  });
});
