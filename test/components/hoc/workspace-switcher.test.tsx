import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceSwitcher } from "@/components/hoc/workspace-switcher";
import { Edition } from "@/interfaces/edition";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { switchWorkspace } from "@/lib/client/auth";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
const refresh = vi.fn();
let session: AppSession | null = null;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/components/providers/session-provider", () => ({
  SESSION_QUERY_KEY: ["session"],
  useAppSession: () => session,
}));
vi.mock("@/lib/client/auth", () => ({ switchWorkspace: vi.fn() }));

const assistant: AppSession = {
  userId: "u-1",
  email: "elif@odtu-dev.invalid",
  fullName: "Elif Şahin",
  jobTitle: "Akademisyen",
  role: UserRole.Academician,
  permissions: [UserRole.Mentee, UserRole.Academician],
  institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
  edition: Edition.Odtu,
};

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session = assistant;
  });

  it("is not there for an account with one workspace", () => {
    session = {
      userId: assistant.userId,
      email: assistant.email,
      fullName: assistant.fullName,
      jobTitle: assistant.jobTitle,
      role: UserRole.Mentor,
    };
    renderWithQueryClient(<WorkspaceSwitcher itemClassName="" />);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("switches a research assistant to the student workspace", async () => {
    vi.mocked(switchWorkspace).mockResolvedValue({
      ...assistant,
      activeWorkspace: Workspace.OdtuStudent,
    });
    const onSwitched = vi.fn();
    const user = userEvent.setup();
    renderWithQueryClient(
      <WorkspaceSwitcher itemClassName="" onSwitched={onSwitched} />,
    );

    expect(
      screen.getByRole("menuitemradio", { name: /Akademisyen/ }),
    ).toHaveAttribute("aria-checked", "true");
    await user.click(
      screen.getByRole("menuitemradio", { name: /ODTÜ Öğrenci/ }),
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith("/student"));
    expect(switchWorkspace).toHaveBeenCalledWith(Workspace.OdtuStudent);
    expect(refresh).toHaveBeenCalled();
    expect(onSwitched).toHaveBeenCalled();
  });

  it("does nothing when the current workspace is picked again", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<WorkspaceSwitcher itemClassName="" />);
    await user.click(
      screen.getByRole("menuitemradio", { name: /Akademisyen/ }),
    );
    expect(switchWorkspace).not.toHaveBeenCalled();
  });
});
