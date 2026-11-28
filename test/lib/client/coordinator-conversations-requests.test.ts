import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  getCoordinatorConversations,
  getCoordinatorMessages,
  sendCoordinatorMessage,
  startCoordinatorConversation,
} from "@/lib/client/coordinator-conversations";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title: "getCoordinatorConversations lists the caller's threads",
    call: () => getCoordinatorConversations(),
    method: "get",
    args: ["/api/coordinator-conversations"],
  },
  {
    title: "startCoordinatorConversation opens a thread with a mentor",
    call: () =>
      startCoordinatorConversation({
        programId: "prog-1",
        organizationId: null,
        mentorId: "mentor-1",
      }),
    method: "post",
    args: [
      "/api/coordinator-conversations",
      { programId: "prog-1", organizationId: null, mentorId: "mentor-1" },
    ],
  },
  {
    title: "getCoordinatorMessages reads the encoded thread",
    call: () => getCoordinatorMessages("c/1"),
    method: "get",
    args: ["/api/coordinator-conversations/c%2F1/messages"],
  },
  {
    title: "sendCoordinatorMessage posts the text to the encoded thread",
    call: () => sendCoordinatorMessage("c/1", "Merhaba"),
    method: "post",
    args: [
      "/api/coordinator-conversations/c%2F1/messages",
      { body: "Merhaba" },
    ],
  },
];

describe("coordinator conversations client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
