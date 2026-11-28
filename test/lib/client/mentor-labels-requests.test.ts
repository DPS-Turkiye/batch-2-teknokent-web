import { beforeEach, describe, vi } from "vitest";

import { MentorLabelColor } from "@/interfaces/mentor-label";
import {
  createMentorLabel,
  deleteMentorLabel,
  getMentorLabelBoard,
  getMentorLabelDirectory,
  getMentorProgramLabels,
  setMentorLabels,
  updateMentorLabel,
} from "@/lib/client/mentor-labels";
import { backendHttp } from "@/lib/client/backend-http";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const P = "/api/coordinator/programs/prog%2F1%20a";
const INPUT = { name: "Fintech", color: MentorLabelColor.Green };

const calls: ClientCall[] = [
  {
    title: "getMentorLabelBoard reads the program's board",
    call: () => getMentorLabelBoard("prog/1 a"),
    method: "get",
    args: [`${P}/mentor-labels`],
  },
  {
    title: "createMentorLabel posts a new label",
    call: () => createMentorLabel("prog/1 a", INPUT),
    method: "post",
    args: [`${P}/mentor-labels`, INPUT],
  },
  {
    title:
      "createMentorLabel sends the name as the backend saves it, trimmed and with one space inside",
    call: () =>
      createMentorLabel("prog/1 a", { ...INPUT, name: "  Yapay   zekâ " }),
    method: "post",
    args: [`${P}/mentor-labels`, { ...INPUT, name: "Yapay zekâ" }],
  },
  {
    title: "updateMentorLabel puts the encoded label's name and color",
    call: () => updateMentorLabel("prog/1 a", "l/1", INPUT),
    method: "put",
    args: [`${P}/mentor-labels/l%2F1`, INPUT],
  },
  {
    title: "deleteMentorLabel deletes the encoded label",
    call: () => deleteMentorLabel("prog/1 a", "l/1"),
    method: "delete",
    args: [`${P}/mentor-labels/l%2F1`],
  },
  {
    title: "setMentorLabels puts the mentor's whole set",
    call: () => setMentorLabels("prog/1 a", "m/1", ["a"]),
    method: "put",
    args: [`${P}/mentors/m%2F1/labels`, { labelIds: ["a"] }],
  },
  {
    title: "getMentorLabelDirectory reads the mentee's program labels",
    call: () => getMentorLabelDirectory(),
    method: "get",
    args: ["/api/mentor-labels/directory"],
  },
  {
    title: "getMentorProgramLabels reads the encoded mentor's labels",
    call: () => getMentorProgramLabels("m/1"),
    method: "get",
    args: ["/api/mentor-labels/mentors/m%2F1"],
  },
];

describe("mentor labels client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
