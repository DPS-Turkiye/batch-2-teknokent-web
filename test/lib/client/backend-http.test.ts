import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientApiError } from "@/lib/client/api";
import {
  backendHttp,
  endBackendSession,
  signedInUserId,
  startBackendSession,
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

type Answer = { status: number; data?: unknown };

const sent: InternalAxiosRequestConfig[] = [];
/** What the fake backend answers, by "METHOD url"; a function answers by how many times it was asked. */
let answers: Record<string, Answer | ((count: number) => Answer)> = {};

function answerFor(config: InternalAxiosRequestConfig): Answer {
  const key = `${config.method?.toUpperCase()} ${config.url}`;
  const answer = answers[key] ?? { status: 200, data: {} };
  if (typeof answer !== "function") return answer;
  return answer(
    sent.filter((c) => `${c.method?.toUpperCase()} ${c.url}` === key).length,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sent.length = 0;
  answers = {};
  vi.mocked(currentIdToken).mockResolvedValue("tab-token");
  vi.mocked(currentFirebaseUid).mockResolvedValue("uid-1");
  // Answers every request here instead of the network, and keeps what was sent.
  backendHttp.defaults.adapter = (config) => {
    sent.push(config);
    const { status, data = {} } = answerFor(config);
    return Promise.resolve({
      status,
      data,
      statusText: "",
      headers: {},
      config,
    });
  };
});

const calls = (key: string) =>
  sent.filter((c) => `${c.method?.toUpperCase()} ${c.url}` === key);

describe("backendHttp", () => {
  it("calls the backend itself on the session cookie, holding no token", async () => {
    await backendHttp.get("/api/x");

    expect(sent[0]?.baseURL).toBe("https://api.example.test");
    expect(sent[0]?.withCredentials).toBe(true);
    expect(sent[0]?.headers.has("Authorization")).toBe(false);
  });

  it("starts a session from the Firebase sign-in on a 401 and sends the call once more", async () => {
    answers["GET /api/x"] = (count) =>
      count === 1 ? { status: 401 } : { status: 200, data: { ok: true } };

    const response = await backendHttp.get("/api/x");

    expect(response.data).toEqual({ ok: true });
    const [start] = calls("POST /api/auth/session");
    expect(start?.headers.get("Authorization")).toBe("Bearer tab-token");
    expect(JSON.parse(String(start?.data))).toEqual({ remember: false });
    expect(calls("GET /api/x")).toHaveLength(2);
  });

  it("answers the second 401 instead of looping", async () => {
    answers["GET /api/x"] = { status: 401 };

    const response = await backendHttp.get("/api/x");

    expect(response.status).toBe(401);
    expect(calls("GET /api/x")).toHaveLength(2);
    expect(calls("POST /api/auth/session")).toHaveLength(1);
  });

  it("starts one session for calls that all found none at once", async () => {
    answers["GET /api/a"] = (count) => ({ status: count === 1 ? 401 : 200 });
    answers["GET /api/b"] = (count) => ({ status: count === 1 ? 401 : 200 });

    await Promise.all([backendHttp.get("/api/a"), backendHttp.get("/api/b")]);

    expect(calls("POST /api/auth/session")).toHaveLength(1);
  });

  it("does not start a session when nobody is signed in to Firebase", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);
    answers["GET /api/x"] = { status: 401 };

    const response = await backendHttp.get("/api/x");

    expect(response.status).toBe(401);
    expect(calls("POST /api/auth/session")).toHaveLength(0);
  });

  it("leaves a call made with its own token alone", async () => {
    answers["GET /api/x"] = { status: 401 };

    await backendHttp.get("/api/x", withToken("onboarding-token"));

    expect(sent).toHaveLength(1);
    expect(sent[0]?.headers.get("Authorization")).toBe(
      "Bearer onboarding-token",
    );
  });

  it("lets every other HTTP status through for requireSuccess to word", async () => {
    answers["GET /api/x"] = { status: 403, data: { message: "Hayır" } };

    expect((await backendHttp.get("/api/x")).status).toBe(403);
  });
});

describe("the API session", () => {
  it("starts with the sign-in's token and remembers it when asked", async () => {
    expect(await startBackendSession("fresh-token", true)).toBe(true);

    const [start] = calls("POST /api/auth/session");
    expect(start?.headers.get("Authorization")).toBe("Bearer fresh-token");
    expect(JSON.parse(String(start?.data))).toEqual({ remember: true });
  });

  it("reports a refused start", async () => {
    answers["POST /api/auth/session"] = { status: 403 };

    expect(await startBackendSession("t")).toBe(false);
  });

  it("ends on sign-out, quietly even when the call fails", async () => {
    await endBackendSession();
    expect(calls("DELETE /api/auth/session")).toHaveLength(1);

    backendHttp.defaults.adapter = () => Promise.reject(new Error("offline"));
    await expect(endBackendSession()).resolves.toBeUndefined();
  });
});

describe("withToken", () => {
  it("signs with the given token, or adds nothing", () => {
    expect(withToken("t")).toEqual({ headers: { Authorization: "Bearer t" } });
    expect(withToken()).toBeUndefined();
    expect(withToken("")).toBeUndefined();
  });
});

describe("signedInUserId", () => {
  beforeEach(() => {
    answers["GET /api/auth/me"] = { status: 200, data: { id: "account-1" } };
  });

  it("asks the backend who is signed in, once per Firebase login", async () => {
    vi.mocked(currentFirebaseUid).mockResolvedValue("uid-once");

    expect(await signedInUserId()).toBe("account-1");
    expect(await signedInUserId()).toBe("account-1");

    expect(calls("GET /api/auth/me")).toHaveLength(1);
  });

  it("asks again for another login in the same tab", async () => {
    vi.mocked(currentFirebaseUid).mockResolvedValue("uid-a");
    await signedInUserId();
    vi.mocked(currentFirebaseUid).mockResolvedValue("uid-b");
    answers["GET /api/auth/me"] = { status: 200, data: { id: "account-2" } };

    expect(await signedInUserId()).toBe("account-2");
  });

  it("does not keep a failed answer", async () => {
    vi.mocked(currentFirebaseUid).mockResolvedValue("uid-failing");
    answers["GET /api/auth/me"] = { status: 503 };
    await expect(signedInUserId()).rejects.toBeInstanceOf(ClientApiError);

    answers["GET /api/auth/me"] = { status: 200, data: { id: "account-3" } };
    expect(await signedInUserId()).toBe("account-3");
  });

  it("asks with a token the caller passes, before any session exists", async () => {
    vi.mocked(currentFirebaseUid).mockResolvedValue(null);

    await signedInUserId("onboarding-token");

    expect(calls("GET /api/auth/me")[0]?.headers.get("Authorization")).toBe(
      "Bearer onboarding-token",
    );
  });
});
