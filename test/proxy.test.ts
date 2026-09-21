import { sealData } from "iron-session";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { UserRole } from "@/interfaces/session";
import { proxy } from "@/proxy";

const PASSWORD = "a-test-session-password-of-32-chars!";

let signedIn = "";
let empty = "";

beforeAll(async () => {
  vi.stubEnv("SESSION_PASSWORD", PASSWORD);
  signedIn = `teknokent_session=${await sealData(
    {
      user: {
        userId: "user-1",
        email: "gulse@dongu.app",
        fullName: "Gülse Buran",
        jobTitle: "Kurucu",
        role: UserRole.Mentee,
        organizationId: "org-1",
        organizationName: "Döngü",
      },
    },
    { password: PASSWORD },
  )}`;
  empty = `teknokent_session=${await sealData({}, { password: PASSWORD })}`;
});
afterAll(() => vi.unstubAllEnvs());

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return proxy(
    new NextRequest(new URL(path, "http://localhost:3000"), { headers }),
  );
}

function clearsTheCookie(response: Response) {
  return /teknokent_session=;/.test(response.headers.get("set-cookie") ?? "");
}

describe("proxy", () => {
  it("lets public routes through without a session cookie", async () => {
    const response = await request("/login");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets the application status page through without a session cookie", async () => {
    const response = await request("/application-status");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends unauthenticated visitors away from protected pages", async () => {
    const response = await request("/dashboard");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fdashboard",
    );
  });

  // Reported: a stranger saw /profile as "Kullanıcı". A cookie that is present
  // but holds no user is not a session.
  it("sends a visitor with a cookie that holds no session to login, and clears it", async () => {
    for (const cookie of [empty, "teknokent_session=not-a-seal"]) {
      const response = await request("/profile", cookie);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?next=%2Fprofile",
      );
      expect(clearsTheCookie(response)).toBe(true);
    }
  });

  it("lets a visitor with a dead cookie reach login instead of bouncing them away", async () => {
    const response = await request("/login", empty);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(clearsTheCookie(response)).toBe(true);
  });

  it("sends a signed-in visitor away from login", async () => {
    const response = await request("/login", signedIn);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("sends a signed-in visitor away from signup", async () => {
    const response = await request("/signup", signedIn);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("honours where the visitor was originally headed", async () => {
    const response = await request("/login?next=%2Fcalendar", signedIn);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/calendar",
    );
  });

  it("refuses to forward to another origin", async () => {
    const response = await request(
      "/login?next=https%3A%2F%2Fevil.example%2Fsteal",
      signedIn,
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("refuses a protocol-relative destination", async () => {
    const response = await request(
      "/login?next=%2F%2Fevil.example%2Fsteal",
      signedIn,
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("lets signed-in visitors into protected pages", async () => {
    const response = await request("/dashboard", signedIn);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(clearsTheCookie(response)).toBe(false);
  });

  it("does not send API calls to login", async () => {
    const response = await request("/api/session");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
