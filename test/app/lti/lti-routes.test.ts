import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { POST as launch } from "@/app/lti/launch/route";
import { GET as loginGet, POST as loginPost } from "@/app/lti/login/route";

vi.mock("@/lib/const", () => ({
  getPublicBackendUrl: () => "https://api.example.test",
}));

describe("the LTI URLs Moodle is set up with", () => {
  it("send a GET login initiation on to the backend with its query", () => {
    const response = loginGet(
      new NextRequest(
        "https://menton.example/lti/login?iss=https%3A%2F%2Fmoodle&login_hint=2",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://api.example.test/api/lti/login?iss=https%3A%2F%2Fmoodle&login_hint=2",
    );
  });

  // 307 keeps the method and the body, so the backend receives Moodle's form as it was posted.
  it("send a form-posted login initiation and the launch on with a 307", () => {
    const login = loginPost(
      new NextRequest("https://menton.example/lti/login", { method: "POST" }),
    );
    const posted = launch();

    expect(login.status).toBe(307);
    expect(login.headers.get("location")).toBe(
      "https://api.example.test/api/lti/login",
    );
    expect(posted.status).toBe(307);
    expect(posted.headers.get("location")).toBe(
      "https://api.example.test/api/lti/launch",
    );
  });
});
