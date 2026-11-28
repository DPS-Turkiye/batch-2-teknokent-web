import { beforeEach, describe, vi } from "vitest";

import { AnnouncementAudience } from "@/interfaces/program-announcement";
import { backendHttp } from "@/lib/client/backend-http";
import {
  getMyAnnouncements,
  getProgramAnnouncements,
  postProgramAnnouncement,
} from "@/lib/client/program-announcements";
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
    title: "getProgramAnnouncements reads the program's announcements",
    call: () => getProgramAnnouncements(PROGRAM),
    method: "get",
    args: [`${P}/announcements`],
  },
  {
    title: "postProgramAnnouncement posts the text for its audience",
    call: () =>
      postProgramAnnouncement(PROGRAM, {
        body: "Yarın demo günü",
        audience: AnnouncementAudience.Mentors,
      }),
    method: "post",
    args: [
      `${P}/announcements`,
      { body: "Yarın demo günü", audience: AnnouncementAudience.Mentors },
    ],
  },
  {
    title: "getMyAnnouncements reads the announcements meant for the caller",
    call: () => getMyAnnouncements(),
    method: "get",
    args: ["/api/program-announcements"],
  },
];

describe("program announcements client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
