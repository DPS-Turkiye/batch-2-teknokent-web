import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, POST } from "@/app/api/meetings/[id]/held/route";
import { UserRole } from "@/interfaces/session";
import { setMeetingHeld } from "@/lib/api/meetings";
import { getSessionUser } from "@/lib/session";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/meetings", () => ({ setMeetingHeld: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const context = { params: Promise.resolve({ id: "m-1" }) };
const request = () =>
  new NextRequest("http://localhost/api/meetings/m-1/held", {
    method: "POST",
  });

function signIn(role: UserRole) {
  vi.mocked(getSessionUser).mockResolvedValue(
    appSession({
      userId: "mentor-1",
      role,
    }),
  );
}

describe("/api/meetings/[id]/held", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(setMeetingHeld).mockResolvedValue({
      data: { id: "m-1" },
      headers: {},
      status: 200,
    });
  });

  it("confirms and undoes as the signed-in mentor", async () => {
    signIn(UserRole.Mentor);

    expect((await POST(request(), context)).status).toBe(200);
    expect((await DELETE(request(), context)).status).toBe(200);

    expect(setMeetingHeld).toHaveBeenNthCalledWith(1, "m-1", "mentor-1", true);
    expect(setMeetingHeld).toHaveBeenNthCalledWith(2, "m-1", "mentor-1", false);
  });

  it("refuses anyone who is not a mentor", async () => {
    signIn(UserRole.Mentee);

    expect((await POST(request(), context)).status).toBe(403);
    expect(setMeetingHeld).not.toHaveBeenCalled();
  });
});
