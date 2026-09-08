import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return proxy(
    new NextRequest(new URL(path, "http://localhost:3000"), { headers }),
  );
}

describe("proxy", () => {
  it("lets public routes through without a session cookie", () => {
    const response = request("/login");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets the application status page through without a session cookie", () => {
    const response = request("/application-status");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends unauthenticated visitors away from protected pages", () => {
    const response = request("/dashboard");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fdashboard",
    );
  });

  // Reported: a signed-in visitor could still open /login and /signup. These
  // two cases previously asserted that they stayed there.
  it("sends a signed-in visitor away from login", () => {
    const response = request("/login", "teknokent_session=signed-in");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("sends a signed-in visitor away from signup", () => {
    const response = request("/signup", "teknokent_session=signed-in");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("honours where the visitor was originally headed", () => {
    const response = request(
      "/login?next=%2Fcalendar",
      "teknokent_session=signed-in",
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/calendar",
    );
  });

  it("refuses to forward to another origin", () => {
    const response = request(
      "/login?next=https%3A%2F%2Fevil.example%2Fsteal",
      "teknokent_session=signed-in",
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("refuses a protocol-relative destination", () => {
    const response = request(
      "/login?next=%2F%2Fevil.example%2Fsteal",
      "teknokent_session=signed-in",
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/workspace",
    );
  });

  it("lets signed-in visitors into protected pages", () => {
    const response = request("/dashboard", "teknokent_session=signed-in");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not send API calls to login", () => {
    const response = request("/api/session");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
