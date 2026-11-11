import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addCoordinatorNote,
  deleteCoordinatorNote,
  fetchCoordinatorNotes,
} from "@/lib/api/coordinator-notes";
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
    "lists an encoded mentorship's notes",
    () => fetchCoordinatorNotes("coord-1", "ms/1"),
    {
      method: "GET",
      url: "/api/coordinator/mentorships/ms%2F1/notes",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "adds a note with its body",
    () => addCoordinatorNote("coord-1", "ms/1", "Görüşme iyi geçti"),
    {
      method: "POST",
      url: "/api/coordinator/mentorships/ms%2F1/notes",
      data: { actorId: "coord-1", body: "Görüşme iyi geçti" },
    },
  ],
  [
    "deletes an encoded note",
    () => deleteCoordinatorNote("coord-1", "note/1"),
    {
      method: "DELETE",
      url: "/api/coordinator/notes/note%2F1",
      params: { actorId: "coord-1" },
    },
  ],
];

describe("coordinator notes server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
