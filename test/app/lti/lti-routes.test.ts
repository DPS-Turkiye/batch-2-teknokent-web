import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as launch } from "@/app/lti/launch/route";
import { GET as loginGet, POST as loginPost } from "@/app/lti/login/route";
import { OfficeHoursRole } from "@/interfaces/office-hours";
import {
  completeLtiLaunch,
  LtiRequestError,
  startLtiLogin,
} from "@/lib/api/lti";
import { saveOfficeHoursUser } from "@/lib/server/office-hours-session";
import { backendRefusal, backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/lti", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/lti")>()),
  startLtiLogin: vi.fn(),
  completeLtiLaunch: vi.fn(),
}));
vi.mock("@/lib/server/office-hours-session", () => ({
  saveOfficeHoursUser: vi.fn(),
}));

function formPost(url: string, fields: Record<string, string>) {
  return new NextRequest(url, {
    method: "POST",
    body: new URLSearchParams(fields),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

const LOGIN = {
  iss: "http://localhost:8081",
  login_hint: "2",
  target_link_uri: "http://localhost:3000/lti/launch",
  lti_message_hint: "hint",
  client_id: "client-1",
  lti_deployment_id: "1",
};

describe("LTI login initiation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the browser on to Moodle with the backend's state and nonce (GET)", async () => {
    vi.mocked(startLtiLogin).mockResolvedValue(
      backendResponse({
        redirectUrl: "http://localhost:8081/mod/lti/auth.php?x",
      }),
    );

    const response = await loginGet(
      new NextRequest(
        `http://localhost:3000/lti/login?${new URLSearchParams(LOGIN)}`,
      ),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "http://localhost:8081/mod/lti/auth.php?x",
    );
    expect(startLtiLogin).toHaveBeenCalledWith(LOGIN);
  });

  it("reads a form POST the same way", async () => {
    vi.mocked(startLtiLogin).mockResolvedValue(
      backendResponse({ redirectUrl: "http://moodle/auth" }),
    );

    const response = await loginPost(
      formPost("http://localhost:3000/lti/login", LOGIN),
    );

    expect(response.headers.get("location")).toBe("http://moodle/auth");
  });

  it("explains a refused login instead of starting it", async () => {
    vi.mocked(startLtiLogin).mockResolvedValue(backendRefusal(400));

    const response = await loginGet(
      new NextRequest(
        `http://localhost:3000/lti/login?${new URLSearchParams(LOGIN)}`,
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/office-hours/launch-error?reason=rejected",
    );
  });

  it("answers a malformed initiation with a 400 that names the field", async () => {
    vi.mocked(startLtiLogin).mockRejectedValue(
      new LtiRequestError("login_hint: Invalid input"),
    );

    const response = await loginGet(
      new NextRequest("http://localhost:3000/lti/login?iss=x"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "login_hint: Invalid input",
    });
  });

  it("says office hours are unavailable when the backend can't be reached", async () => {
    vi.mocked(startLtiLogin).mockRejectedValue(new Error("down"));

    const response = await loginGet(
      new NextRequest(
        `http://localhost:3000/lti/login?${new URLSearchParams(LOGIN)}`,
      ),
    );

    expect(response.headers.get("location")).toContain("reason=unavailable");
  });
});

describe("LTI launch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("signs the person in and opens the course they came from", async () => {
    vi.mocked(completeLtiLaunch).mockResolvedValue(
      backendResponse({
        userId: "user-1",
        fullName: "Ayşe Yılmaz",
        courseId: "course-1",
        courseTitle: "Introduction to Computing",
        role: OfficeHoursRole.Student,
      }),
    );

    const response = await launch(
      formPost("http://localhost:3000/lti/launch", {
        id_token: "token",
        state: "state-1",
      }),
    );

    expect(completeLtiLaunch).toHaveBeenCalledWith({
      id_token: "token",
      state: "state-1",
    });
    expect(saveOfficeHoursUser).toHaveBeenCalledWith({
      userId: "user-1",
      fullName: "Ayşe Yılmaz",
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/office-hours/courses/course-1",
    );
  });

  it.each([
    [401, "rejected"],
    [403, "no-role"],
    [503, "unavailable"],
  ])(
    "explains a %s from the backend without a session",
    async (status, reason) => {
      vi.mocked(completeLtiLaunch).mockResolvedValue(backendRefusal(status));

      const response = await launch(
        formPost("http://localhost:3000/lti/launch", {
          id_token: "token",
          state: "state-1",
        }),
      );

      expect(response.headers.get("location")).toContain(`reason=${reason}`);
      expect(saveOfficeHoursUser).not.toHaveBeenCalled();
    },
  );

  it("answers a malformed launch with a 400 that names the field", async () => {
    vi.mocked(completeLtiLaunch).mockRejectedValue(
      new LtiRequestError("id_token: Invalid input"),
    );

    const response = await launch(
      formPost("http://localhost:3000/lti/launch", { state: "s" }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).message).toBe("id_token: Invalid input");
    expect(saveOfficeHoursUser).not.toHaveBeenCalled();
  });
});
