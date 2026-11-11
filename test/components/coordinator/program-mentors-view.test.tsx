import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramMentorsView } from "@/components/coordinator/program-mentors-view";
import { MentorPoolStatus, type MentorPoolRow } from "@/interfaces/mentor-pool";
import {
  cancelMentorInvite,
  decideProgramMentor,
  getCoordinatorProgram,
  getMentorPool,
  getMentorReview,
  inviteProgramMentor,
  renewMentorInvite,
} from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

// Rendered outside the App Router, the real usePathname returns null.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/coordinator/programs/program-1",
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  getMentorPool: vi.fn(),
  inviteProgramMentor: vi.fn(),
  withdrawProgramMentorInvite: vi.fn(),
  getMentorReview: vi.fn(),
  decideProgramMentor: vi.fn(),
  renewMentorInvite: vi.fn(),
  cancelMentorInvite: vi.fn(),
}));

const active: MentorPoolRow = {
  mentorId: "mentor-1",
  inviteId: null,
  fullName: "Nihan Öztürk",
  email: "nihan@ozturk.design",
  status: MentorPoolStatus.Active,
  expertise: ["UX/UI Design"],
  programs: ["METU Stars"],
  activeTeams: 3,
  capacity: 4,
  since: "2026-09-20T10:00:00Z",
  expiresAt: null,
  inviteCode: null,
};
const awaiting: MentorPoolRow = {
  ...active,
  mentorId: "mentor-2",
  fullName: "Zeynep Arslan",
  email: "zeynep@arslanlaw.com",
  status: MentorPoolStatus.AwaitingApproval,
  expertise: ["Hukuk"],
  programs: [],
  activeTeams: 0,
};
const invited: MentorPoolRow = {
  ...active,
  mentorId: null,
  inviteId: "invite-1",
  fullName: null,
  email: "cagri@yilmazfinans.com",
  status: MentorPoolStatus.Invited,
  expertise: [],
  programs: [],
  activeTeams: 0,
  expiresAt: "2026-10-03T10:00:00Z",
  inviteCode: "abc123",
};

describe("ProgramMentorsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(getMentorPool).mockResolvedValue([active, awaiting, invited]);
  });

  it("shows load, pending checks and invites, and filters to the invites", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    expect(await screen.findByText("Nihan Öztürk")).toBeInTheDocument();
    expect(screen.getByText("3/4 mentorluk")).toBeInTheDocument();
    expect(screen.getByText("Kayıt bekleniyor")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Davet bekliyor 1" }));
    expect(screen.queryByText("Nihan Öztürk")).not.toBeInTheDocument();
    expect(screen.getByText("cagri@yilmazfinans.com")).toBeInTheDocument();
  });

  it("reads in English and filters by capacity", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramMentorsView programId="program-1" />
      </InLocale>,
    );

    expect(await screen.findByText("3/4 mentorships")).toBeInTheDocument();
    expect(screen.getByText("Waiting for sign-up")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Invited 1" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mentorship load")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Capacity:" }),
      "Has room",
    );
    expect(screen.getByText("Nihan Öztürk")).toBeInTheDocument();
    expect(
      screen.queryByText("cagri@yilmazfinans.com"),
    ).not.toBeInTheDocument();
  });

  it("invites by email and copies the signup link for someone without an account", async () => {
    vi.mocked(inviteProgramMentor).mockResolvedValue([active, invited]);
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: /Mentor davet et/ }),
    );
    const form = screen.getByRole("form", { name: "Mentor davet et" });
    await user.type(within(form).getByLabelText("E-posta"), "cagri@yilmaz");
    await user.click(within(form).getByRole("button", { name: "Davet et" }));
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Geçerli bir e-posta adresi girin.",
    );

    await user.type(within(form).getByLabelText("E-posta"), "finans.com");
    await user.click(within(form).getByRole("button", { name: "Davet et" }));

    expect(inviteProgramMentor).toHaveBeenCalledWith(
      "program-1",
      "cagri@yilmazfinans.com",
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/signup?role=mentor&programInvite=abc123"),
    );
    expect(
      await screen.findByText(
        /cagri@yilmazfinans.com adresine e-postayla gönderildi/,
      ),
    ).toBeInTheDocument();
  });

  it("renews and takes back a waiting invite", async () => {
    vi.mocked(renewMentorInvite).mockResolvedValue([invited]);
    vi.mocked(cancelMentorInvite).mockResolvedValue([]);
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: "Tekrar gönder" }),
    );
    expect(renewMentorInvite).toHaveBeenCalledWith("program-1", "invite-1");
    expect(
      await screen.findByText(/yeniden e-postayla gönderildi/),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "cagri@yilmazfinans.com davetini geri al",
      }),
    );
    expect(cancelMentorInvite).toHaveBeenCalledWith("program-1", "invite-1");
  });

  it("approves a mentor only after the coordinator confirms the expertise", async () => {
    vi.mocked(getMentorReview).mockResolvedValue({
      mentorId: "mentor-2",
      fullName: "Zeynep Arslan",
      email: "zeynep@arslanlaw.com",
      professionalTitle: "Avukat",
      requestedAt: "2026-09-24T10:00:00Z",
      viaInvite: true,
      emailVerified: true,
      linkedinUrl: null,
      invitedBy: "Elif Demir",
      expertise: ["Hukuk", "Yatırım"],
      availability: "Salı öğleden sonra",
      capacity: 3,
    });
    vi.mocked(decideProgramMentor).mockResolvedValue([active]);
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramMentorsView programId="program-1" />);

    await user.click(await screen.findByRole("button", { name: "İncele" }));
    const review = await screen.findByRole("region", {
      name: "Uzmanlık doğrulama",
    });
    expect(
      within(review).getByText("Elif Demir (koordinatör) davet etti"),
    ).toBeInTheDocument();
    expect(
      within(review).getByRole("link", { name: "Ek bilgi iste" }),
    ).toHaveAttribute("href", expect.stringContaining("mailto:zeynep@"));
    const approve = within(review).getByRole("button", {
      name: "Onayla ve havuza ekle",
    });
    expect(approve).toBeDisabled();

    await user.click(within(review).getByRole("checkbox"));
    await user.click(approve);
    expect(decideProgramMentor).toHaveBeenCalledWith(
      "program-1",
      "mentor-2",
      true,
    );
  });
});
