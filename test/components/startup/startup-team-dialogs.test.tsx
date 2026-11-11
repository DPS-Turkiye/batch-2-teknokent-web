import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  LeaveTeamDialog,
  MemberFormDialog,
  RemoveMemberDialog,
} from "@/components/startup/startup-team-dialogs";
import type { useStartupTeam } from "@/hooks/use-startup-team";
import type { useTeamChanges } from "@/hooks/use-team-changes";
import { MemberFormMode } from "@/lib/startup-team";
import { memberFixture } from "@test/fixtures/startup-team";

type Team = ReturnType<typeof useStartupTeam>;

/** What useStartupTeam returns with the add form open and empty; every action is a spy. */
function team(overrides: Partial<Team> = {}): Team {
  return {
    askRemove: vi.fn<Team["askRemove"]>(),
    canEdit: vi.fn<Team["canEdit"]>(),
    canRemove: vi.fn<Team["canRemove"]>(),
    cancelRemove: vi.fn<Team["cancelRemove"]>(),
    closeForm: vi.fn<Team["closeForm"]>(),
    confirmRemove: vi.fn<Team["confirmRemove"]>(),
    draft: {
      mode: MemberFormMode.Add,
      memberId: null,
      fullName: "",
      email: "",
      jobTitle: "",
    },
    error: null,
    formError: null,
    isLoading: false,
    isRemoving: false,
    isSaving: false,
    members: [],
    removalNeedsApproval: false,
    openAdd: vi.fn<Team["openAdd"]>(),
    openEdit: vi.fn<Team["openEdit"]>(),
    removingMember: null,
    setField: vi.fn<Team["setField"]>(),
    submitForm: vi.fn<Team["submitForm"]>(),
    viewerIsFounder: true,
    ...overrides,
  };
}

describe("MemberFormDialog", () => {
  it("renders nothing without a draft", () => {
    const { container } = render(
      <MemberFormDialog team={team({ draft: null })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("collects a new member's details", async () => {
    const user = userEvent.setup();
    const form = team();
    render(<MemberFormDialog team={form} />);

    await user.type(screen.getByLabelText("Ad soyad"), "E");
    await user.type(screen.getByLabelText("E-posta"), "e");
    await user.click(screen.getByRole("button", { name: "Ekle" }));

    expect(form.setField).toHaveBeenCalledWith("fullName", "E");
    expect(form.setField).toHaveBeenCalledWith("email", "e");
    expect(form.submitForm).toHaveBeenCalled();
  });

  it("locks the email while editing and shows the problem", () => {
    render(
      <MemberFormDialog
        team={team({
          draft: {
            mode: MemberFormMode.Edit,
            memberId: "cto",
            fullName: "",
            email: "cto@dongu.co",
            jobTitle: "CTO",
          },
          formError: "Ad soyad gerekli.",
        })}
      />,
    );

    expect(screen.getByLabelText("E-posta")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Ad soyad gerekli.");
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeInTheDocument();
  });
});

describe("RemoveMemberDialog", () => {
  it("names the member and confirms", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <RemoveMemberDialog
        asRequest={false}
        isRemoving={false}
        member={memberFixture("cto")}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByText(/Kerem Aksoy ekipten çıkarılır/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Çıkar" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe("MemberFormDialog keyboard", () => {
  it("submits when Enter is pressed in a field", async () => {
    const user = userEvent.setup();
    const form = team();
    render(<MemberFormDialog team={form} />);

    await user.type(screen.getByLabelText("Ad soyad"), "E{Enter}");

    expect(form.submitForm).toHaveBeenCalled();
  });
});

type Changes = ReturnType<typeof useTeamChanges>;

/** What useTeamChanges returns for a member asked to confirm leaving; every action is a spy. */
function changes(overrides: Partial<Changes> = {}): Changes {
  return {
    alone: false,
    canLeave: true,
    cancel: vi.fn<Changes["cancel"]>(),
    cancellingId: null,
    changeFor: vi.fn<Changes["changeFor"]>(() => null),
    closeLeave: vi.fn<Changes["closeLeave"]>(),
    confirmLeave: vi.fn<Changes["confirmLeave"]>(),
    confirmingLeave: true,
    inProgram: true,
    isLeaving: false,
    myChange: null,
    openLeave: vi.fn<Changes["openLeave"]>(),
    refresh: vi.fn<Changes["refresh"]>(),
    requestedByMe: vi.fn<Changes["requestedByMe"]>(() => false),
    setSuccessorId: vi.fn<Changes["setSuccessorId"]>(),
    successorId: "",
    successors: [memberFixture("cto")],
    viewerIsLeader: false,
    ...overrides,
  };
}

describe("LeaveTeamDialog", () => {
  it("sends a member's leave to the coordinator", async () => {
    const user = userEvent.setup();
    const value = changes();
    render(<LeaveTeamDialog changes={value} />);

    expect(screen.getByText(/koordinatörüne gider/)).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Yeni takım lideri"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Talep gönder" }));
    expect(value.confirmLeave).toHaveBeenCalled();
  });

  it("makes the leader pick a successor before leaving", async () => {
    const user = userEvent.setup();
    const value = changes({ viewerIsLeader: true });
    const { rerender } = render(<LeaveTeamDialog changes={value} />);

    expect(screen.getByRole("button", { name: "Ayrıl" })).toBeDisabled();
    await user.selectOptions(
      screen.getByLabelText("Yeni takım lideri"),
      "Kerem Aksoy",
    );
    expect(value.setSuccessorId).toHaveBeenCalledWith("cto");

    rerender(
      <LeaveTeamDialog
        changes={changes({ viewerIsLeader: true, successorId: "cto" })}
      />,
    );
    expect(screen.getByRole("button", { name: "Ayrıl" })).toBeEnabled();
  });

  it("warns a leader alone in the team that the startup is archived", () => {
    render(
      <LeaveTeamDialog
        changes={changes({ viewerIsLeader: true, alone: true })}
      />,
    );

    expect(screen.getByText(/startup arşivlenir/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ayrıl" })).toBeEnabled();
  });

  it("says when nobody can take the lead", () => {
    render(
      <LeaveTeamDialog
        changes={changes({ viewerIsLeader: true, successors: [] })}
      />,
    );

    expect(
      screen.getByText(/Önce bu talepler sonuçlanmalı/),
    ).toBeInTheDocument();
  });
});
