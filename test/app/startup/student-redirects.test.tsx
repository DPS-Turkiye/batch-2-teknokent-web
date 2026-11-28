import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StartupCreatePage from "@/app/startup/create/page";
import StartupProfilePage from "@/app/startup/page";
import StartupProfileToolsPage from "@/app/startup/profile-tools/page";
import StartupTeamPage from "@/app/startup/team/page";
import { useStartupPageGate } from "@/hooks/use-individual-program";

vi.mock("@/hooks/use-individual-program", () => ({
  useStartupPageGate: vi.fn(),
}));
vi.mock("@/components/startup/startup-start-view", () => ({
  StartupHome: () => <p>startup page</p>,
}));
vi.mock("@/components/startup/startup-team-view", () => ({
  StartupTeamView: () => <p>startup page</p>,
}));
vi.mock("@/components/startup/startup-create-view", () => ({
  StartupCreateView: () => <p>startup page</p>,
}));
vi.mock("@/components/startup/startup-profile-tools-view", () => ({
  StartupProfileToolsView: () => <p>startup page</p>,
}));

describe("startup-only pages", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["Profil", StartupProfilePage, false, ""],
    ["Ekip", StartupTeamPage, false, ""],
    ["create", StartupCreatePage, false, ""],
    ["profile tools", StartupProfileToolsPage, true, "/startup/profile-tools"],
  ])(
    "render %s only once the gate lets the person in",
    (_name, Page, strict, path) => {
      vi.mocked(useStartupPageGate).mockReturnValue(false);
      const { unmount } = render(<Page />);
      expect(screen.queryByText("startup page")).toBeNull();
      expect(useStartupPageGate).toHaveBeenCalledWith({ strict, path });
      unmount();

      vi.mocked(useStartupPageGate).mockReturnValue(true);
      render(<Page />);
      expect(screen.getByText("startup page")).toBeTruthy();
    },
  );
});
