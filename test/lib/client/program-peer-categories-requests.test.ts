import { beforeEach, describe, vi } from "vitest";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { backendHttp } from "@/lib/client/backend-http";
import {
  getProgramPeerCategories,
  replaceProgramPeerCategories,
} from "@/lib/client/program-peer-categories";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

// An id with a slash and a space proves the path segment is encoded.
const PROGRAM = "prog/1 a";
const P = "/api/coordinator/programs/prog%2F1%20a";

const calls: ClientCall[] = [
  {
    title: "getProgramPeerCategories reads the program's categories",
    call: () => getProgramPeerCategories(PROGRAM),
    method: "get",
    args: [`${P}/peer-categories`],
  },
  {
    title:
      "replaceProgramPeerCategories puts the whole set, an empty one included",
    call: () => replaceProgramPeerCategories(PROGRAM, []),
    method: "put",
    args: [`${P}/peer-categories`, { categories: [] }],
  },
  {
    title: "replaceProgramPeerCategories puts the chosen categories",
    call: () =>
      replaceProgramPeerCategories(PROGRAM, [PeerTopicCategory.CampusLife]),
    method: "put",
    args: [
      `${P}/peer-categories`,
      { categories: [PeerTopicCategory.CampusLife] },
    ],
  },
];

describe("program peer categories client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
