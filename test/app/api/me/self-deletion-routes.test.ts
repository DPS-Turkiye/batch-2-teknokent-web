import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as deleteAccountRoute } from "@/app/api/me/delete/route";
import { GET as optionsRoute } from "@/app/api/me/deletion/route";
import { POST as deleteStartupRoute } from "@/app/api/me/startup/delete/route";
import { AccountDeletionBlock } from "@/interfaces/self-deletion";
import {
  deleteOwnAccount,
  deleteOwnStartup,
  fetchSelfDeletionOptions,
} from "@/lib/api/self-deletion";
import { SessionRequiredError } from "@/lib/server/session-error";
import { destroySession, getSessionIds } from "@/lib/session";
import {
  backendRefusal,
  backendResponse,
  tokenRequest,
} from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/self-deletion", () => ({
  deleteOwnAccount: vi.fn(),
  deleteOwnStartup: vi.fn(),
  fetchSelfDeletionOptions: vi.fn(),
}));
vi.mock("@/lib/session", () => ({
  destroySession: vi.fn(),
  getSessionIds: vi.fn(),
}));

function call(
  route: (request: Request) => Promise<Response>,
  url: string,
  method: string,
  body?: unknown,
  token: string | undefined = "id-token",
) {
  return route(tokenRequest(`http://localhost${url}`, { method, token, body }));
}

describe("the self-deletion routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("reads what the person may delete with their own token", async () => {
    const options = {
      account: { allowed: false, blockedReason: AccountDeletionBlock.Founder },
      startup: { id: "org-1", name: "Döngü Labs" },
    };
    vi.mocked(fetchSelfDeletionOptions).mockResolvedValue(
      backendResponse(options),
    );

    const response = await call(optionsRoute, "/api/me/deletion", "GET");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(options);
    expect(fetchSelfDeletionOptions).toHaveBeenCalledWith("id-token");
  });

  it("deletes the account with the typed word and ends the session cookie", async () => {
    vi.mocked(deleteOwnAccount).mockResolvedValue(
      backendResponse({ deletedUserId: "user-1", cleanupPending: false }),
    );

    const response = await call(deleteAccountRoute, "/api/me/delete", "POST", {
      confirmation: " SİL ",
      actorId: "someone-else",
    });

    expect(response.status).toBe(200);
    expect(deleteOwnAccount).toHaveBeenCalledWith("SİL", "id-token");
    expect(destroySession).toHaveBeenCalledOnce();
  });

  it("keeps the session when the backend refuses the deletion", async () => {
    vi.mocked(deleteOwnAccount).mockResolvedValue(
      backendRefusal(409, { code: "REAUTH_REQUIRED", message: "Sign in" }),
    );

    const response = await call(deleteAccountRoute, "/api/me/delete", "POST", {
      confirmation: "SİL",
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "REAUTH_REQUIRED" });
    expect(destroySession).not.toHaveBeenCalled();
  });

  it("deletes the founder's startup by its typed name, never by an id from the browser", async () => {
    vi.mocked(deleteOwnStartup).mockResolvedValue(
      backendResponse({ deletedOrganizationId: "org-1", cleanupPending: true }),
    );

    const response = await call(
      deleteStartupRoute,
      "/api/me/startup/delete",
      "POST",
      { confirmName: "Döngü Labs", organizationId: "org-2" },
    );

    expect(response.status).toBe(200);
    expect(deleteOwnStartup).toHaveBeenCalledWith("Döngü Labs", "id-token");
  });

  it.each([
    [
      "the account",
      deleteAccountRoute,
      "/api/me/delete",
      { confirmation: "SİL" },
    ],
    [
      "the startup",
      deleteStartupRoute,
      "/api/me/startup/delete",
      { confirmName: "Döngü Labs" },
    ],
  ])(
    "asks for a sign-in before deleting %s without a token or a session",
    async (_target, route, url, body) => {
      const noToken = await call(route, url, "POST", body, "");
      vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());
      const noSession = await call(route, url, "POST", body);

      expect(noToken.status).toBe(401);
      expect(noSession.status).toBe(401);
      expect(deleteOwnAccount).not.toHaveBeenCalled();
      expect(deleteOwnStartup).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      "an empty word",
      deleteAccountRoute,
      "/api/me/delete",
      { confirmation: " " },
    ],
    [
      "a missing name",
      deleteStartupRoute,
      "/api/me/startup/delete",
      { confirmName: "" },
    ],
  ])(
    "refuses %s before asking the backend",
    async (_case, route, url, body) => {
      const response = await call(route, url, "POST", body);

      expect(response.status).toBe(400);
      expect(deleteOwnAccount).not.toHaveBeenCalled();
      expect(deleteOwnStartup).not.toHaveBeenCalled();
    },
  );
});
