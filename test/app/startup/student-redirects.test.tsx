import { beforeEach, describe, expect, it, vi } from "vitest";

import StartupCreatePage from "@/app/startup/create/page";
import StartupProfilePage from "@/app/startup/page";
import StartupTeamPage from "@/app/startup/team/page";
import { redirectIndividualMentee } from "@/lib/server/individual-program";

vi.mock("@/lib/server/individual-program", () => ({
  redirectIndividualMentee: vi.fn(),
}));
vi.mock("@/components/startup/startup-start-view", () => ({
  StartupHome: () => null,
}));
vi.mock("@/components/startup/startup-team-view", () => ({
  StartupTeamView: () => null,
}));
vi.mock("@/components/startup/startup-create-view", () => ({
  StartupCreateView: () => null,
}));

describe("startup-only pages", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["Profil", StartupProfilePage],
    ["Ekip", StartupTeamPage],
    ["create", StartupCreatePage],
  ])("send a student away before %s renders", async (_name, Page) => {
    vi.mocked(redirectIndividualMentee).mockRejectedValue(
      new Error("REDIRECT:/startup/process"),
    );
    await expect(Page()).rejects.toThrow("REDIRECT:/startup/process");

    vi.mocked(redirectIndividualMentee).mockResolvedValue(undefined);
    await expect(Page()).resolves.toBeTruthy();
  });
});
