import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCoordinatorConversations,
  fetchCoordinatorMessages,
  sendCoordinatorMessage,
  startCoordinatorConversation,
} from "@/lib/api/coordinator-conversations";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists the actor's coordinator conversations",
    () => fetchCoordinatorConversations("coord-1"),
    {
      method: "GET",
      url: "/api/coordinator-conversations",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "starts a conversation with the actor added to the body",
    () =>
      startCoordinatorConversation("coord-1", {
        programId: "prog-1",
        organizationId: "org-1",
        mentorId: null,
      }),
    {
      method: "POST",
      url: "/api/coordinator-conversations",
      data: {
        programId: "prog-1",
        organizationId: "org-1",
        mentorId: null,
        actorId: "coord-1",
      },
    },
  ],
  [
    "lists an encoded conversation's messages",
    () => fetchCoordinatorMessages("coord-1", "conv/1"),
    {
      method: "GET",
      url: "/api/coordinator-conversations/conv%2F1/messages",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "sends a message with its body",
    () => sendCoordinatorMessage("coord-1", "conv/1", "Merhaba"),
    {
      method: "POST",
      url: "/api/coordinator-conversations/conv%2F1/messages",
      data: { actorId: "coord-1", body: "Merhaba" },
    },
  ],
];

describe("coordinator conversations server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
