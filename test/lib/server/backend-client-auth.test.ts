import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getBackendUrl } from "@/lib/const";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("axios", () => ({ default: { request: vi.fn() } }));

function sentConfig() {
  const call = vi.mocked(axios.request).mock.lastCall;
  if (!call) throw new Error("axios.request was not called");
  return call[0];
}

describe("backendRequest authentication", () => {
  beforeEach(() => {
    vi.mocked(axios.request).mockReset();
    vi.stubEnv("BACKEND_USERNAME", "svc");
    vi.stubEnv("BACKEND_PASSWORD", "secret");
    vi.mocked(axios.request).mockResolvedValue({
      status: 201,
      data: { id: "x" },
      headers: { "x-total": "3" },
    });
  });

  it("signs with the server's own Basic credentials by default", async () => {
    await backendRequest({ method: "GET", url: "/api/health" });

    const config = sentConfig();
    expect(config.auth).toEqual({ username: "svc", password: "secret" });
    expect(config.headers).not.toHaveProperty("Authorization");
    expect(config.baseURL).toBe(getBackendUrl());
    expect(config.timeout).toBe(15000);
  });

  it("refuses to call the backend when the server's credentials are missing", async () => {
    vi.stubEnv("BACKEND_PASSWORD", "");

    await expect(
      backendRequest({ method: "GET", url: "/api/health" }),
    ).rejects.toThrow(/BACKEND_USERNAME and BACKEND_PASSWORD/);
    expect(axios.request).not.toHaveBeenCalled();
  });

  it("signs with the person's Firebase token instead of Basic credentials", async () => {
    vi.stubEnv("BACKEND_USERNAME", "");

    await backendRequest(
      { method: "GET", url: "/api/auth/me" },
      { idToken: "id-token" },
    );

    const config = sentConfig();
    expect(config.auth).toBeUndefined();
    expect(config.headers).toMatchObject({ Authorization: "Bearer id-token" });
  });

  it("sends no credentials at all for a public call", async () => {
    vi.stubEnv("BACKEND_USERNAME", "");

    await backendRequest(
      { method: "GET", url: "/api/programs/names" },
      { authenticated: false },
    );

    const config = sentConfig();
    expect(config.auth).toBeUndefined();
    expect(config.headers).not.toHaveProperty("Authorization");
  });

  it("lets the caller's own headers and timeout win over the defaults", async () => {
    await backendRequest({
      method: "GET",
      url: "/export",
      timeout: 60000,
      headers: { Accept: "*/*" },
    });

    const config = sentConfig();
    expect(config.timeout).toBe(60000);
    expect(config.headers).toMatchObject({ Accept: "*/*" });
  });

  it("never lets axios throw on an error status, so the caller can pass it on", async () => {
    await backendRequest({ method: "GET", url: "/api/health" });

    const { validateStatus } = sentConfig();
    expect(validateStatus?.(500)).toBe(true);
    expect(validateStatus?.(404)).toBe(true);
  });

  it("answers only the data, the headers and the status", async () => {
    const response = await backendRequest({ method: "GET", url: "/x" });

    expect(response).toEqual({
      status: 201,
      data: { id: "x" },
      headers: { "x-total": "3" },
    });
  });
});
