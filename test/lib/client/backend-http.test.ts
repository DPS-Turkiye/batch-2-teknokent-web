import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientApiError } from "@/lib/client/api";
import {
  backendHttp,
  signedInUserId,
  withToken,
} from "@/lib/client/backend-http";
import { currentFirebaseUid, currentIdToken } from "@/lib/firebase/auth";

vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn(),
  currentFirebaseUid: vi.fn(),
}));
vi.mock("@/lib/const", () => ({
  getPublicBackendUrl: () => "https://api.example.test",
}));

const sent: InternalAxiosRequestConfig[] = [];
let answer: { status: number; data: unknown } = { status: 200, data: {} };

beforeEach(() => {
  vi.clearAllMocks();
  sent.length = 0;
  answer = { status: 200, data: { id: "account-1" } };
  vi.mocked(currentIdToken).mockResolvedValue("tab-token");
  vi.mocked(currentFirebaseUid).mockResolvedValue("uid-1");
  // Answers every request here instead of the network, and keeps what was sent.
  backendHttp.defaults.adapter = (config) => {
    sent.push(config);
    return Promise.resolve({
      ...answer,
      statusText: "",
      headers: {},
      config,
    });
  };
});

describe("backendHttp", () => {
  it("calls the backend itself with the tab's own Firebase token", async () => {
    await backendHttp.get("/api/x");

    expect(sent[0]?.baseURL).toBe("https://api.example.test");
    expect(sent[0]?.headers.get("Authorization")).toBe("Bearer tab-token");
  });

  it("keeps a token the caller passes instead of the tab's", async () => {
    await backendHttp.get("/api/x", withToken("onboarding-token"));

    expect(sent[0]?.headers.get("Authorization")).toBe(
      "Bearer onboarding-token",
    );
    expect(currentIdToken).not.toHaveBeenCalled();
  });

  it("sends nothing and asks for a new sign-in when nobody is signed in", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    const call = backendHttp.get("/api/x");

    await expect(call).rejects.toBeInstanceOf(ClientApiError);
    await expect(call).rejects.toMatchObject({ status: 401 });
    expect(sent).toHaveLength(0);
  });

  it("lets every HTTP status through for requireSuccess to word", async () => {
    answer = { status: 403, data: { message: "Hayır" } };

    const response = await backendHttp.get("/api/x");

    expect(response.status).toBe(403);
  });
});

describe("withToken", () => {
  it("signs with the given token, or leaves the tab's own to the interceptor", () => {
    expect(withToken("t")).toEqual({ headers: { Authorization: "Bearer t" } });
    expect(withToken()).toBeUndefined();
    expect(withToken("")).toBeUndefined();
  });
});

describe("signedInUserId", () => {
  it("asks the backend who the token is, once per Firebase login", async () => {
    vi.mocked(currentFirebaseUid).mockResolvedValue("uid-once");

    expect(await signedInUserId()).toBe("account-1");
    expect(await signedInUserId()).toBe("account-1");

    expect(sent).toHaveLength(1);
    expect(sent[0]?.url).toBe("/api/auth/me");
  });

  it("asks again for another login in the same tab", async () => {
    vi.mocked(currentFirebaseUid).mockResolvedValue("uid-a");
    await signedInUserId();
    vi.mocked(currentFirebaseUid).mockResolvedValue("uid-b");
    answer = { status: 200, data: { id: "account-2" } };

    expect(await signedInUserId()).toBe("account-2");
    expect(sent).toHaveLength(2);
  });

  it("does not keep a failed answer", async () => {
    vi.mocked(currentFirebaseUid).mockResolvedValue("uid-failing");
    answer = { status: 503, data: {} };
    await expect(signedInUserId()).rejects.toBeInstanceOf(ClientApiError);

    answer = { status: 200, data: { id: "account-3" } };
    expect(await signedInUserId()).toBe("account-3");
  });

  it("signs the ask with a token the caller passes, and keeps nothing without a login", async () => {
    vi.mocked(currentFirebaseUid).mockResolvedValue(null);

    await signedInUserId("onboarding-token");
    await signedInUserId("onboarding-token");

    expect(sent).toHaveLength(2);
    expect(sent[0]?.headers.get("Authorization")).toBe(
      "Bearer onboarding-token",
    );
  });
});
