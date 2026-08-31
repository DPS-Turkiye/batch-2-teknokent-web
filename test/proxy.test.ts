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

  it("lets visitors stay on login even if a leftover session cookie exists", () => {
    const response = request("/login", "teknokent_session=signed-in");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets visitors stay on signup even if a leftover session cookie exists", () => {
    const response = request("/signup", "teknokent_session=signed-in");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets signed-in visitors into protected pages", () => {
    const response = request("/dashboard", "teknokent_session=signed-in");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
