import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMeetingTodo,
  deleteMeetingTodo,
  fetchMeetingNote,
  fetchMeetingNoteDocument,
  saveMeetingNote,
  updateMeetingTodo,
} from "@/lib/api/meeting-notes";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const session = { userId: "user-1", organizationId: "org-1" };

describe("meeting note server API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes note reads to the caller organization", async () => {
    await fetchMeetingNote("meeting-1", "org-1");

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Get,
      url: "/api/meetings/meeting-1/note",
      params: { organizationId: "org-1" },
    });
  });

  it("sends the editor content together with the session identity", async () => {
    await saveMeetingNote("meeting-1", session, {
      content: "<p>Sprint</p>",
    });

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Put,
      url: "/api/meetings/meeting-1/note",
      data: {
        content: "<p>Sprint</p>",
        userId: "user-1",
        organizationId: "org-1",
      },
    });
  });

  it("scopes live document reads to the caller organization", async () => {
    await fetchMeetingNoteDocument("meeting-1", "org-1");

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Get,
      url: "/api/meetings/meeting-1/note/document",
      params: { organizationId: "org-1" },
    });
  });

  it("creates todos for the meeting", async () => {
    await createMeetingTodo("meeting-1", session, { title: "Demo hazirla" });

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Post,
      url: "/api/meetings/meeting-1/todos",
      data: {
        title: "Demo hazirla",
        userId: "user-1",
        organizationId: "org-1",
      },
    });
  });

  it("updates and removes a single todo", async () => {
    await updateMeetingTodo("meeting-1", "todo-1", "org-1", { done: true });
    await deleteMeetingTodo("meeting-1", "todo-1", "org-1");

    expect(backendRequest).toHaveBeenNthCalledWith(1, {
      method: HttpMethod.Patch,
      url: "/api/meetings/meeting-1/todos/todo-1",
      data: { done: true, organizationId: "org-1" },
    });
    expect(backendRequest).toHaveBeenNthCalledWith(2, {
      method: HttpMethod.Delete,
      url: "/api/meetings/meeting-1/todos/todo-1",
      params: { organizationId: "org-1" },
    });
  });

  it("encodes ids in the URL", async () => {
    await fetchMeetingNote("meeting with space", "org-1");

    expect(backendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/meetings/meeting%20with%20space/note",
      }),
    );
  });
});
