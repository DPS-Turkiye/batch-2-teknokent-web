import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StartupProfileInput } from "@/interfaces/organization";
import { refreshSession } from "@/lib/client/auth";
import { backendHttp } from "@/lib/client/backend-http";
import {
  createStartup,
  getOrganizationById,
  getStartupProfile,
  joinStartup,
  resubmitStartup,
  saveStartupProfile,
  saveStartupStatus,
} from "@/lib/client/organization";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { appSession } from "@test/fixtures/session";
import { OWN_ORGANIZATION_PATH as OWN } from "@test/mocks/own-organization";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/own-organization", async () =>
  (await import("@test/mocks/own-organization")).ownOrganizationMock(),
);
vi.mock("@/lib/client/auth", () => ({ refreshSession: vi.fn() }));

const profile: StartupProfileInput = {
  name: "Acme",
  description: null,
  website: null,
  problem: null,
  solution: null,
  currentSolution: null,
  targetUser: null,
  sector: null,
  maturity: null,
  programLevel: null,
  supportAreas: [],
  fundingStage: null,
  foundedYear: null,
};
const status = {
  statusVersion: "v2",
  statusSummary: "Pilot başladı",
  completionPercent: 40,
};
const newStartup = { name: "Acme", supportAreas: [], teamMembers: [] };

const calls: ClientCall[] = [
  {
    title: "getStartupProfile reads the caller's own startup",
    call: () => getStartupProfile(),
    method: "get",
    args: [OWN],
  },
  {
    title: "getOrganizationById reads the encoded organization",
    call: () => getOrganizationById("org/2"),
    method: "get",
    args: ["/api/organizations/org%2F2"],
  },
  {
    title: "saveStartupProfile puts the editable profile, naming nobody",
    call: () => saveStartupProfile(profile),
    method: "put",
    args: [OWN, profile],
  },
  {
    title: "resubmitStartup posts to the own startup's resubmit",
    call: () => resubmitStartup(),
    method: "post",
    args: [`${OWN}/resubmit`],
  },
  {
    title: "saveStartupStatus puts the status",
    call: () => saveStartupStatus(status),
    method: "put",
    args: [`${OWN}/status`, status],
  },
];

describe("organization client, straight to the backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);

  it.each([
    [
      "joinStartup posts the invite code",
      () => joinStartup("ABC123"),
      ["/api/organizations/join", { inviteCode: "ABC123" }],
    ],
    [
      "createStartup posts the new startup",
      () => createStartup(newStartup),
      ["/api/organizations/mine", newStartup],
    ],
  ] as const)(
    "%s, then answers with the session read again, now carrying the startup",
    async (_title, call, args) => {
      const session = appSession({ organizationId: "org-9" });
      vi.mocked(backendHttp.post).mockResolvedValue({ status: 200, data: {} });
      vi.mocked(refreshSession).mockResolvedValue(session);

      expect(await call()).toEqual(session);
      expect(backendHttp.post).toHaveBeenCalledWith(...args);
    },
  );

  it("does not read the session again when the backend refuses the code", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue({
      status: 400,
      data: { message: "Bu kod geçerli değil." },
    });

    await expect(joinStartup("YANLIS")).rejects.toThrow(
      "Bu kod geçerli değil.",
    );
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("fails when the session cannot be read again", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue({ status: 200, data: {} });
    vi.mocked(refreshSession).mockResolvedValue(null);

    await expect(joinStartup("ABC123")).rejects.toMatchObject({ status: 401 });
  });
});
