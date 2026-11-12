import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinatorPicker } from "@/components/admin/coordinator-picker";
import {
  CoordinatorCandidateStatus,
  type CoordinatorCandidate,
} from "@/interfaces/admin-coordinator";
import { UserRole } from "@/interfaces/session";
import {
  getCoordinatorCandidate,
  searchCoordinators,
} from "@/lib/client/admin-coordinators";
import {
  existingChoice,
  invitedChoice,
  type CoordinatorChoice,
} from "@/lib/coordinator-picker";
import { renderWithQueryClient } from "@test/test-utils";

// The e-mail field waits for typing to settle before it searches; leave room on a busy machine.
const PICKER_WAIT = 3000;

vi.mock("@/lib/client/admin-coordinators", () => ({
  searchCoordinators: vi.fn(),
  getCoordinatorCandidate: vi.fn(),
}));

const ayse = { id: "c-1", fullName: "Ayşe Aydın", email: "ayse@teknokent.org" };
const ayten = {
  id: "c-2",
  fullName: "Ayten Kaya",
  email: "ayten@teknokent.org",
};

function candidate(
  overrides: Partial<CoordinatorCandidate> = {},
): CoordinatorCandidate {
  return {
    email: "yeni@teknokent.org",
    status: CoordinatorCandidateStatus.New,
    userId: null,
    fullName: null,
    role: null,
    ...overrides,
  };
}

const changes = vi.fn<(next: CoordinatorChoice[]) => void>();

function Harness({
  initial = [],
  programId,
}: {
  initial?: CoordinatorChoice[];
  programId?: string;
}) {
  const [chosen, setChosen] = useState<CoordinatorChoice[]>(initial);
  return (
    <CoordinatorPicker
      chosen={chosen}
      programId={programId}
      onChange={(next) => {
        changes(next);
        setChosen(next);
      }}
    />
  );
}

function emailField() {
  return screen.getByLabelText("Koordinatör e-postası");
}

describe("CoordinatorPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchCoordinators).mockResolvedValue([]);
    vi.mocked(getCoordinatorCandidate).mockResolvedValue(candidate());
  });

  it("lists nobody and asks the backend nothing before three characters", async () => {
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    await clicker.type(emailField(), "ay");

    expect(
      screen.getByText("Aramak için en az 3 karakter yaz."),
    ).toBeInTheDocument();
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    expect(searchCoordinators).not.toHaveBeenCalled();
  });

  it("shows matching coordinators and adds the picked one as a chip", async () => {
    vi.mocked(searchCoordinators).mockResolvedValue([ayse, ayten]);
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness programId="program-1" />);

    await clicker.type(emailField(), "ayse");
    await clicker.click(
      await screen.findByRole(
        "button",
        { name: "Ayşe Aydın ekle" },
        { timeout: PICKER_WAIT },
      ),
    );

    expect(searchCoordinators).toHaveBeenLastCalledWith("ayse", "program-1");
    expect(changes).toHaveBeenLastCalledWith([existingChoice(ayse)]);
    const chosen = screen.getByRole("list", { name: "Seçilen koordinatörler" });
    expect(chosen).toHaveTextContent("Ayşe Aydın");
    expect(emailField()).toHaveValue("");
    expect(
      screen.queryByRole("list", { name: "Eşleşen koordinatörler" }),
    ).not.toBeInTheDocument();
  });

  it("invites a whole e-mail with no account once a name is given", async () => {
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness />);

    await clicker.type(emailField(), "Yeni@Teknokent.org");
    expect(
      await screen.findByText(
        "yeni@teknokent.org adresiyle menton'da hesap yok. Koordinatör olarak davet edebilirsin.",
      ),
    ).toBeInTheDocument();
    const invite = screen.getByRole("button", { name: "Davet et" });
    expect(invite).toBeDisabled();

    await clicker.type(screen.getByLabelText("Ad soyad"), " Yeni Kişi ");
    await clicker.click(invite);

    expect(getCoordinatorCandidate).toHaveBeenCalledWith("yeni@teknokent.org");
    expect(changes).toHaveBeenLastCalledWith([
      invitedChoice("yeni@teknokent.org", "Yeni Kişi"),
    ]);
    expect(screen.getByText("Davet edilecek")).toBeInTheDocument();
  });

  it("keeps the typed name while a typo in the e-mail is fixed, then clears both on invite", async () => {
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness />);

    await clicker.type(emailField(), "yeni@teknokent.og");
    await clicker.type(await screen.findByLabelText("Ad soyad"), "Yeni Kişi");
    await clicker.clear(emailField());
    await clicker.type(emailField(), "yeni@teknokent.org");
    expect(await screen.findByLabelText("Ad soyad")).toHaveValue("Yeni Kişi");

    await clicker.type(screen.getByLabelText("Ad soyad"), "{Enter}");

    expect(changes).toHaveBeenLastCalledWith([
      invitedChoice("yeni@teknokent.org", "Yeni Kişi"),
    ]);
    expect(getCoordinatorCandidate).toHaveBeenLastCalledWith(
      "yeni@teknokent.org",
    );
    expect(emailField()).toHaveFocus();
    expect(emailField()).toHaveValue("");

    await clicker.type(emailField(), "baska@teknokent.org");
    expect(await screen.findByLabelText("Ad soyad")).toHaveValue("");
  });

  it.each([
    [CoordinatorCandidateStatus.Admin, "Bu e-posta bir yöneticiye ait."],
    [
      CoordinatorCandidateStatus.Reactivatable,
      "Eski Koordinatör pasif bir koordinatör. Önce Kullanıcılar bölümünden yeniden etkinleştir.",
    ],
  ])("explains a %s e-mail", async (status, text) => {
    vi.mocked(getCoordinatorCandidate).mockResolvedValue(
      candidate({
        email: "eski@x.org",
        status,
        userId: "u-1",
        fullName: "Eski Koordinatör",
        role: UserRole.Coordinator,
      }),
    );
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness />);

    await clicker.type(emailField(), "eski@x.org");

    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it("explains an existing mentor's e-mail instead of offering to invite or promote", async () => {
    vi.mocked(getCoordinatorCandidate).mockResolvedValue(
      candidate({
        email: "ece@mentor.org",
        status: CoordinatorCandidateStatus.Promotable,
        userId: "m-1",
        fullName: "Ece Mentor",
        role: UserRole.Mentor,
      }),
    );
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness />);

    await clicker.type(emailField(), "ece@mentor.org");

    expect(
      await screen.findByText(
        "Ece Mentor menton'da mentor olarak kayıtlı. Koordinatör yapmak için önce Kullanıcılar › Koordinatör ekle bölümünü kullan.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Davet et" }),
    ).not.toBeInTheDocument();
  });

  it("says when nothing matches a partial e-mail", async () => {
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness />);

    await clicker.type(emailField(), "zzz");

    expect(
      await screen.findByText(/Bu e-postayla başlayan bir koordinatör yok/),
    ).toBeInTheDocument();
    expect(getCoordinatorCandidate).not.toHaveBeenCalled();
  });

  it("shows a failed search", async () => {
    vi.mocked(searchCoordinators).mockRejectedValue(
      new Error("Sunucuya ulaşılamadı."),
    );
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness />);

    await clicker.type(emailField(), "ayse");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sunucuya ulaşılamadı.",
    );
  });

  it("hides a coordinator already chosen and removes a chip", async () => {
    vi.mocked(searchCoordinators).mockResolvedValue([ayse, ayten]);
    const clicker = userEvent.setup();
    renderWithQueryClient(<Harness initial={[existingChoice(ayse)]} />);

    await clicker.type(emailField(), "ayt");
    expect(
      await screen.findByRole(
        "button",
        { name: "Ayten Kaya ekle" },
        { timeout: PICKER_WAIT },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ayşe Aydın ekle" }),
    ).not.toBeInTheDocument();

    await clicker.click(
      screen.getByRole("button", { name: "Ayşe Aydın kaldır" }),
    );
    expect(changes).toHaveBeenLastCalledWith([]);
  });
});
