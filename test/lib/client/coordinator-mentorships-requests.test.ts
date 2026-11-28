import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  getCoordinatorMentorship,
  getCoordinatorMentorships,
  remindCoordinatorMentorship,
} from "@/lib/client/coordinator-mentorships";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title: "getCoordinatorMentorships lists every program's pairs without a program",
    call: () => getCoordinatorMentorships(null),
    method: "get",
    args: ["/api/coordinator/mentorships", { params: undefined }],
  },
  {
    title: "getCoordinatorMentorships narrows to the chosen program",
    call: () => getCoordinatorMentorships("prog-1"),
    method: "get",
    args: ["/api/coordinator/mentorships", { params: { programId: "prog-1" } }],
  },
  {
    title: "getCoordinatorMentorship reads the encoded pair",
    call: () => getCoordinatorMentorship("ms/1"),
    method: "get",
    args: ["/api/coordinator/mentorships/ms%2F1"],
  },
  {
    title: "remindCoordinatorMentorship reminds the encoded pair",
    call: () => remindCoordinatorMentorship("ms/1"),
    method: "post",
    args: ["/api/coordinator/mentorships/ms%2F1/remind"],
    returnsNothing: true,
  },
];

describe("coordinator mentorships client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
