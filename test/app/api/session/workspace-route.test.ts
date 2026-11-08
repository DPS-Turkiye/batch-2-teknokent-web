import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/session/workspace/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { getSessionUser, switchSessionWorkspace } from "@/lib/session";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
  switchSessionWorkspace: vi.fn(),
}));

const signedIn: AppSession = {
  userId: "u-1",
  email: "elif@odtu-dev.invalid",
  fullName: "Elif Şahin",
  jobTitle: "Akademisyen",
  role: UserRole.Academician,
};

function ask(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/session/workspace", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/session/workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(signedIn);
  });

  it("switches to a workspace the account can open", async () => {
    vi.mocked(switchSessionWorkspace).mockResolvedValue({
      ...signedIn,
      activeWorkspace: Workspace.OdtuStudent,
    });

    const response = await ask({ workspace: Workspace.OdtuStudent });

    expect(response.status).toBe(200);
    expect((await response.json()).activeWorkspace).toBe(Workspace.OdtuStudent);
    expect(switchSessionWorkspace).toHaveBeenCalledWith(Workspace.OdtuStudent);
  });

  it("refuses a workspace the account cannot open, or one that does not exist", async () => {
    vi.mocked(switchSessionWorkspace).mockResolvedValue(null);
    expect((await ask({ workspace: Workspace.Admin })).status).toBe(403);
    expect((await ask({ workspace: "ROOT" })).status).toBe(403);
    expect(switchSessionWorkspace).toHaveBeenCalledTimes(1);
  });

  it("needs a session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await ask({ workspace: Workspace.OdtuStudent })).status).toBe(401);
  });
});
