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

function team(overrides: Partial<Team> = {}) {
  return {
    closeForm: vi.fn(),
    draft: {
      mode: MemberFormMode.Add,
      memberId: null,
      fullName: "",
      email: "",
      jobTitle: "",
    },
    formError: null,
    isSaving: false,
    setField: vi.fn(),
    submitForm: vi.fn(),
    ...overrides,
  } as unknown as Team;
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

function changes(overrides: Partial<Changes> = {}) {
  return {
    alone: false,
    closeLeave: vi.fn(),
    confirmLeave: vi.fn(),
    confirmingLeave: true,
    isLeaving: false,
    setSuccessorId: vi.fn(),
    successorId: "",
    successors: [memberFixture("cto")],
    viewerIsLeader: false,
    ...overrides,
  } as unknown as Changes;
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
