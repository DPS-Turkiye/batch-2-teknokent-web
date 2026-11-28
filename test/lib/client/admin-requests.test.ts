import { beforeEach, describe, vi } from "vitest";

import { getAdminAcademics } from "@/lib/client/admin-academics";
import {
  addCoordinator,
  getCoordinatorCandidate,
  resendCoordinatorPasswordSetup,
  searchCoordinators,
  setCoordinatorAccess,
} from "@/lib/client/admin-coordinators";
import {
  listAdminInterventions,
  openAdminIntervention,
  resolveAdminIntervention,
} from "@/lib/client/admin-interventions";
import { getAdminOverview } from "@/lib/client/admin-overview";
import { deleteUserAccount } from "@/lib/client/admin-users";
import { backendHttp } from "@/lib/client/backend-http";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const COORDINATORS = "/api/admin/coordinators";
const INTERVENTIONS = "/api/admin/interventions";

// None of these names the caller: the backend takes the admin from the session and refuses anyone else.
const calls: ClientCall[] = [
  {
    title: "getAdminOverview reads the overview",
    call: () => getAdminOverview(),
    method: "get",
    args: ["/api/admin/overview"],
  },
  {
    title: "getAdminAcademics lists every academician",
    call: () => getAdminAcademics(),
    method: "get",
    args: ["/api/admin/academics"],
  },
  {
    title: "getCoordinatorCandidate checks a typed address",
    call: () => getCoordinatorCandidate("a@b.com"),
    method: "get",
    args: [`${COORDINATORS}/candidate`, { params: { email: "a@b.com" } }],
  },
  {
    title: "searchCoordinators searches by a trimmed prefix",
    call: () => searchCoordinators("  ays  "),
    method: "get",
    args: [`${COORDINATORS}/search`, { params: { q: "ays" } }],
  },
  {
    title: "searchCoordinators leaves out the program's own coordinators",
    call: () => searchCoordinators("ays", "prog-1"),
    method: "get",
    args: [
      `${COORDINATORS}/search`,
      { params: { q: "ays", programId: "prog-1" } },
    ],
  },
  {
    title: "addCoordinator sends the name and the address",
    call: () => addCoordinator({ fullName: "Ayşe", email: "ayse@metu.edu.tr" }),
    method: "post",
    args: [COORDINATORS, { fullName: "Ayşe", email: "ayse@metu.edu.tr" }],
  },
  {
    title: "setCoordinatorAccess changes an encoded coordinator's access",
    call: () => setCoordinatorAccess("c/1", false),
    method: "put",
    args: [`${COORDINATORS}/c%2F1/access`, { active: false }],
  },
  {
    title: "resendCoordinatorPasswordSetup sends a fresh link",
    call: () => resendCoordinatorPasswordSetup("c/1"),
    method: "post",
    args: [`${COORDINATORS}/c%2F1/password-setup`],
  },
  {
    title: "listAdminInterventions lists the follow-ups",
    call: () => listAdminInterventions(),
    method: "get",
    args: [INTERVENTIONS],
  },
  {
    title: "openAdminIntervention opens one for a mentorship",
    call: () =>
      openAdminIntervention({ mentorshipId: "m-1", action: "Ara", note: "" }),
    method: "post",
    args: [INTERVENTIONS, { mentorshipId: "m-1", action: "Ara", note: "" }],
  },
  {
    title:
      "resolveAdminIntervention closes an encoded follow-up without a body",
    call: () => resolveAdminIntervention("i/1"),
    method: "put",
    args: [`${INTERVENTIONS}/i%2F1/resolve`],
  },
  {
    title: "deleteUserAccount sends the typed address on the admin's own token",
    call: () => deleteUserAccount("user/1", " ayse@example.com ", "id-token"),
    method: "post",
    args: [
      "/api/admin/users/user%2F1/delete",
      { confirmEmail: "ayse@example.com" },
      { headers: { Authorization: "Bearer id-token" } },
    ],
  },
];

describe("admin clients, straight to the backend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
