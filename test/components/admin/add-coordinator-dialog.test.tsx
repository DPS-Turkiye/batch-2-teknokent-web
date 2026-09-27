import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddCoordinatorDialog } from "@/components/admin/add-coordinator-dialog";
import { CoordinatorAccessControl } from "@/components/admin/coordinator-access-control";
import { CoordinatorCandidateStatus } from "@/interfaces/admin-coordinator";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  addCoordinator,
  getCoordinatorCandidate,
  resendCoordinatorPasswordSetup,
  setCoordinatorAccess,
} from "@/lib/client/admin-coordinators";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-coordinators", () => ({
  getCoordinatorCandidate: vi.fn(),
  addCoordinator: vi.fn(),
  setCoordinatorAccess: vi.fn(),
  resendCoordinatorPasswordSetup: vi.fn(),
}));

const account = {
  id: "c-1",
  email: "elif@teknokent.org",
  fullName: "Elif Demir",
  status: UserAccountStatus.Approved,
  outcome: CoordinatorCandidateStatus.New,
};

describe("AddCoordinatorDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks for a name for a new email and adds the coordinator", async () => {
    vi.mocked(getCoordinatorCandidate).mockResolvedValue({
      email: "elif@teknokent.org",
      status: CoordinatorCandidateStatus.New,
      userId: null,
      fullName: null,
      role: null,
    });
    vi.mocked(addCoordinator).mockResolvedValue(account);
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithQueryClient(<AddCoordinatorDialog onClose={onClose} />);

    await user.type(screen.getByLabelText("E-posta"), "elif@teknokent.org");
    expect(
      await screen.findByText(/yeni bir koordinatör hesabı açılacak/),
    ).toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Kaydet" });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText("Ad soyad"), "Elif Demir");
    await user.click(save);

    expect(addCoordinator).toHaveBeenCalledWith({
      fullName: "Elif Demir",
      email: "elif@teknokent.org",
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("promotes an existing mentor without asking for a name", async () => {
    vi.mocked(getCoordinatorCandidate).mockResolvedValue({
      email: "ayse@mentor.com",
      status: CoordinatorCandidateStatus.Promotable,
      userId: "u-1",
      fullName: "Ayşe Demir",
      role: UserRole.Mentor,
    });
    vi.mocked(addCoordinator).mockResolvedValue({
      ...account,
      fullName: "Ayşe Demir",
      outcome: CoordinatorCandidateStatus.Promotable,
    });
    const user = userEvent.setup();
    renderWithQueryClient(<AddCoordinatorDialog onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("E-posta"), "ayse@mentor.com");
    expect(await screen.findByText(/şu an mentor/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Ad soyad")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(addCoordinator).toHaveBeenCalledWith({
      fullName: "Ayşe Demir",
      email: "ayse@mentor.com",
    });
  });

  it("explains a refusal and keeps Kaydet disabled", async () => {
    vi.mocked(getCoordinatorCandidate).mockResolvedValue({
      email: "team@startup.com",
      status: CoordinatorCandidateStatus.TeamMember,
      userId: "u-2",
      fullName: "Can Yılmaz",
      role: UserRole.Mentee,
    });
    const user = userEvent.setup();
    renderWithQueryClient(<AddCoordinatorDialog onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("E-posta"), "team@startup.com");

    expect(
      await screen.findByText(/Takım üyeleri koordinatör yapılamaz/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeDisabled();
    expect(addCoordinator).not.toHaveBeenCalled();
  });

  it("does not check something that is not an email yet", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddCoordinatorDialog onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("E-posta"), "elif@");
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(getCoordinatorCandidate).not.toHaveBeenCalled();
  });
});

describe("CoordinatorAccessControl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deactivates an active coordinator and reactivates a passive one", async () => {
    vi.mocked(setCoordinatorAccess).mockResolvedValue({
      ...account,
      status: UserAccountStatus.Rejected,
    });
    const user = userEvent.setup();
    const { unmount } = renderWithQueryClient(
      <CoordinatorAccessControl id="c-1" status={UserAccountStatus.Approved} />,
    );

    await user.click(screen.getByRole("button", { name: "Pasife al" }));
    expect(setCoordinatorAccess).toHaveBeenCalledWith("c-1", false);
    unmount();

    renderWithQueryClient(
      <CoordinatorAccessControl id="c-1" status={UserAccountStatus.Rejected} />,
    );
    await user.click(
      screen.getByRole("button", { name: "Yeniden etkinleştir" }),
    );
    expect(setCoordinatorAccess).toHaveBeenLastCalledWith("c-1", true);
  });

  it("resends the password setup email, only while the coordinator is active", async () => {
    vi.mocked(resendCoordinatorPasswordSetup).mockResolvedValue(account);
    const user = userEvent.setup();
    const { unmount } = renderWithQueryClient(
      <CoordinatorAccessControl id="c-1" status={UserAccountStatus.Approved} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Şifre e-postasını tekrar gönder" }),
    );
    expect(resendCoordinatorPasswordSetup).toHaveBeenCalledWith("c-1");
    unmount();

    renderWithQueryClient(
      <CoordinatorAccessControl id="c-1" status={UserAccountStatus.Rejected} />,
    );
    expect(
      screen.queryByRole("button", { name: "Şifre e-postasını tekrar gönder" }),
    ).not.toBeInTheDocument();
  });

  it("shows nothing for an account still waiting for approval", () => {
    renderWithQueryClient(
      <CoordinatorAccessControl id="c-1" status={UserAccountStatus.Pending} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
