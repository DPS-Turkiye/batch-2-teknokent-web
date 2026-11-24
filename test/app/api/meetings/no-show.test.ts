import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, POST } from "@/app/api/meetings/[id]/no-show/route";
import { UserRole } from "@/interfaces/session";
import { clearMeetingNoShow, markMeetingNoShow } from "@/lib/api/meetings";
import { getSessionUser } from "@/lib/session";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/meetings", () => ({
  clearMeetingNoShow: vi.fn(),
  markMeetingNoShow: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const context = { params: Promise.resolve({ id: "m-1" }) };
const request = (body: unknown) =>
  new NextRequest("http://localhost/api/meetings/m-1/no-show", {
    method: "POST",
    body: JSON.stringify(body),
  });
const answer = { data: { id: "m-1" }, headers: {}, status: 200 };

function signIn(role: UserRole) {
  vi.mocked(getSessionUser).mockResolvedValue(
    appSession({ userId: "mentor-1", role }),
  );
}

describe("/api/meetings/[id]/no-show", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(markMeetingNoShow).mockResolvedValue(answer);
    vi.mocked(clearMeetingNoShow).mockResolvedValue(answer);
  });

  it("marks and undoes as the signed-in mentor, whoever the body names", async () => {
    signIn(UserRole.Mentor);

    const marked = await POST(
      request({ note: "Haber vermedi", mentorId: "someone-else" }),
      context,
    );
    expect(marked.status).toBe(200);
    expect((await DELETE(request({}), context)).status).toBe(200);

    expect(markMeetingNoShow).toHaveBeenCalledWith(
      "m-1",
      "mentor-1",
      "Haber vermedi",
    );
    expect(clearMeetingNoShow).toHaveBeenCalledWith("m-1", "mentor-1");
  });

  it("accepts a mark without a note", async () => {
    signIn(UserRole.Mentor);

    expect((await POST(request({}), context)).status).toBe(200);
    expect(markMeetingNoShow).toHaveBeenCalledWith("m-1", "mentor-1", "");
  });

  it("refuses a note that is too long", async () => {
    signIn(UserRole.Mentor);

    const response = await POST(request({ note: "a".repeat(256) }), context);

    expect(response.status).toBe(400);
    expect(markMeetingNoShow).not.toHaveBeenCalled();
  });

  it.each([UserRole.Mentee, UserRole.Coordinator])(
    "refuses a %s",
    async (role) => {
      signIn(role);

      expect((await POST(request({}), context)).status).toBe(403);
      expect((await DELETE(request({}), context)).status).toBe(403);
      expect(markMeetingNoShow).not.toHaveBeenCalled();
      expect(clearMeetingNoShow).not.toHaveBeenCalled();
    },
  );
});
