import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorLabelColor } from "@/interfaces/mentor-label";
import {
  createMentorLabel,
  deleteMentorLabel,
  fetchMentorLabelBoard,
  fetchMentorLabelDirectory,
  fetchMentorProgramLabels,
  setMentorLabels,
  updateMentorLabel,
} from "@/lib/api/mentor-labels";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const BOARD = "/api/coordinator/programs/prog%2F1/mentor-labels";
const INPUT = { name: "Fintech", color: MentorLabelColor.Green };

const cases: [string, () => Promise<unknown>, AxiosRequestConfig][] = [
  [
    "reads a program's board for the actor",
    () => fetchMentorLabelBoard("actor-1", "prog/1"),
    { method: HttpMethod.Get, url: BOARD, params: { actorId: "actor-1" } },
  ],
  [
    "creates a label with the actor in the body",
    () => createMentorLabel("actor-1", "prog/1", INPUT),
    {
      method: HttpMethod.Post,
      url: BOARD,
      data: { actorId: "actor-1", ...INPUT },
    },
  ],
  [
    "updates one encoded label",
    () => updateMentorLabel("actor-1", "prog/1", "label 1", INPUT),
    {
      method: HttpMethod.Put,
      url: `${BOARD}/label%201`,
      data: { actorId: "actor-1", ...INPUT },
    },
  ],
  [
    "deletes one encoded label",
    () => deleteMentorLabel("actor-1", "prog/1", "label 1"),
    {
      method: HttpMethod.Delete,
      url: `${BOARD}/label%201`,
      params: { actorId: "actor-1" },
    },
  ],
  [
    "replaces one mentor's labels",
    () => setMentorLabels("actor-1", "prog/1", "mentor/1", ["a", "b"]),
    {
      method: HttpMethod.Put,
      url: "/api/coordinator/programs/prog%2F1/mentors/mentor%2F1/labels",
      data: { actorId: "actor-1", labelIds: ["a", "b"] },
    },
  ],
  [
    "reads the mentee directory for the actor",
    () => fetchMentorLabelDirectory("mentee-1"),
    {
      method: HttpMethod.Get,
      url: "/api/mentor-labels/directory",
      params: { actorId: "mentee-1" },
    },
  ],
  [
    "reads one encoded mentor's labels for the actor",
    () => fetchMentorProgramLabels("mentee-1", "mentor/1"),
    {
      method: HttpMethod.Get,
      url: "/api/mentor-labels/mentors/mentor%2F1",
      params: { actorId: "mentee-1" },
    },
  ],
];

describe("mentor labels server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
