import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as getMessages,
  POST as send,
} from "@/app/api/coordinator-conversations/[id]/messages/route";
import { GET, POST } from "@/app/api/coordinator-conversations/route";
import {
  fetchCoordinatorConversations,
  fetchCoordinatorMessages,
  sendCoordinatorMessage,
  startCoordinatorConversation,
} from "@/lib/api/coordinator-conversations";
import { getSessionIds } from "@/lib/session";
import { answerEachWith, backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/coordinator-conversations", () => ({
  fetchCoordinatorConversations: vi.fn(),
  startCoordinatorConversation: vi.fn(),
  fetchCoordinatorMessages: vi.fn(),
  sendCoordinatorMessage: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

const ok = backendResponse([]);
const params = { params: Promise.resolve({ id: "conversation-1" }) };

function post(body: unknown) {
  return new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("coordinator conversation routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "coordinator-1",
      organizationId: "",
    });
  });

  it("lists and starts threads as the signed-in user", async () => {
    answerEachWith(
      [fetchCoordinatorConversations, startCoordinatorConversation],
      ok,
    );

    expect((await GET()).status).toBe(200);
    expect(fetchCoordinatorConversations).toHaveBeenCalledWith("coordinator-1");

    await POST(
      post({ programId: "program-1", mentorId: "mentor-1", actorId: "x" }),
    );
    expect(startCoordinatorConversation).toHaveBeenCalledWith("coordinator-1", {
      programId: "program-1",
      organizationId: null,
      mentorId: "mentor-1",
    });
  });

  it("reads and sends messages in one thread", async () => {
    answerEachWith([fetchCoordinatorMessages, sendCoordinatorMessage], ok);

    await getMessages(new Request("http://localhost"), params);
    expect(fetchCoordinatorMessages).toHaveBeenCalledWith(
      "coordinator-1",
      "conversation-1",
    );

    await send(post({ body: "Merhaba" }), params);
    expect(sendCoordinatorMessage).toHaveBeenCalledWith(
      "coordinator-1",
      "conversation-1",
      "Merhaba",
    );
  });

  it("answers 401 without a session", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "",
      organizationId: "",
    });

    expect((await GET()).status).toBe(401);
    expect(fetchCoordinatorConversations).not.toHaveBeenCalled();
  });
});
