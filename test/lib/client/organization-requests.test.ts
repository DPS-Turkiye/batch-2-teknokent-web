import { beforeEach, describe, vi } from "vitest";

import type { StartupProfileInput } from "@/interfaces/organization";
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

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

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
    title: "getStartupProfile reads the user's startup",
    call: () => getStartupProfile(),
    method: "get",
    args: ["/api/organizations/profile"],
  },
  {
    title: "getOrganizationById reads the encoded organization",
    call: () => getOrganizationById("org/1"),
    method: "get",
    args: ["/api/organizations/org%2F1"],
  },
  {
    title: "saveStartupProfile puts the editable profile",
    call: () => saveStartupProfile(profile),
    method: "put",
    args: ["/api/organizations/profile", profile],
  },
  {
    title: "joinStartup posts the invite code",
    call: () => joinStartup("ABC123"),
    method: "post",
    args: ["/api/organizations/join", { inviteCode: "ABC123" }],
  },
  {
    title: "createStartup posts the new startup",
    call: () => createStartup(newStartup),
    method: "post",
    args: ["/api/organizations/mine", newStartup],
  },
  {
    title: "resubmitStartup posts an empty body to resubmit",
    call: () => resubmitStartup(),
    method: "post",
    args: ["/api/organizations/resubmit", {}],
  },
  {
    title: "saveStartupStatus puts the status",
    call: () => saveStartupStatus(status),
    method: "put",
    args: ["/api/organizations/status", status],
  },
];

describe("organization client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
