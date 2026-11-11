import { beforeEach, describe, vi } from "vitest";

import {
  createProgram,
  decideProgramInvitation,
  getMemberProgramEvents,
  getOrganizationPrograms,
  getProgramDetail,
  getProgramInvitations,
  getProgramNames,
  getPrograms,
  setActiveProgram,
} from "@/lib/client/programs";
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

const calls: ClientCall[] = [
  {
    title: "getPrograms lists the programs",
    call: () => getPrograms(),
    method: "get",
    args: ["/api/programs"],
  },
  {
    title: "getProgramDetail reads one encoded program",
    call: () => getProgramDetail("prog/1"),
    method: "get",
    args: ["/api/programs/prog%2F1"],
  },
  {
    title: "getProgramNames lists the program names",
    call: () => getProgramNames(),
    method: "get",
    args: ["/api/programs/names"],
  },
  {
    title: "getMemberProgramEvents sends the range as ISO instants",
    call: () =>
      getMemberProgramEvents({
        from: new Date("2026-03-01T00:00:00Z"),
        to: new Date("2026-03-31T21:00:00Z"),
      }),
    method: "get",
    args: [
      "/api/programs/events",
      {
        params: {
          from: "2026-03-01T00:00:00.000Z",
          to: "2026-03-31T21:00:00.000Z",
        },
      },
    ],
  },
  {
    title: "getOrganizationPrograms lists the startup's own programs",
    call: () => getOrganizationPrograms(),
    method: "get",
    args: ["/api/programs/mine"],
  },
  {
    title: "setActiveProgram puts the chosen program",
    call: () => setActiveProgram("prog-1"),
    method: "put",
    args: ["/api/programs/mine/active", { programId: "prog-1" }],
  },
  {
    title: "setActiveProgram clears the active program with null",
    call: () => setActiveProgram(null),
    method: "put",
    args: ["/api/programs/mine/active", { programId: null }],
  },
  {
    title: "getProgramInvitations lists the startup's invitations",
    call: () => getProgramInvitations(),
    method: "get",
    args: ["/api/programs/invitations"],
  },
  {
    title: "createProgram posts the new program's name",
    call: () => createProgram("Kuluçka"),
    method: "post",
    args: ["/api/programs", { name: "Kuluçka" }],
  },
  {
    title: "decideProgramInvitation posts the decision for the encoded program",
    call: () => decideProgramInvitation("prog/1", false),
    method: "post",
    args: ["/api/programs/prog%2F1/invitations/decide", { accepted: false }],
  },
];

describe("programs client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
