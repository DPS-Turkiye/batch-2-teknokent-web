import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  MemberFormDialog,
  RemoveMemberDialog,
} from "@/components/startup/startup-team-dialogs";
import type { useStartupTeam } from "@/hooks/use-startup-team";
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
