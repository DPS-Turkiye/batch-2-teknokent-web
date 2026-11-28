import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  addCoordinatorNote,
  deleteCoordinatorNote,
  getCoordinatorNotes,
} from "@/lib/client/coordinator-notes";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title: "getCoordinatorNotes reads the encoded pair's notes",
    call: () => getCoordinatorNotes("ms/1"),
    method: "get",
    args: ["/api/coordinator/mentorships/ms%2F1/notes"],
  },
  {
    title: "addCoordinatorNote posts the note under the encoded pair",
    call: () => addCoordinatorNote("ms/1", "Görüşme gecikti"),
    method: "post",
    args: [
      "/api/coordinator/mentorships/ms%2F1/notes",
      { body: "Görüşme gecikti" },
    ],
  },
  {
    title: "deleteCoordinatorNote deletes the encoded note",
    call: () => deleteCoordinatorNote("n/1"),
    method: "delete",
    args: ["/api/coordinator/notes/n%2F1"],
    returnsNothing: true,
  },
];

describe("coordinator notes client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
