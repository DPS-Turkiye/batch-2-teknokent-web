import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Edition } from "@/interfaces/edition";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { ACCOUNT_TYPE_COOKIE } from "@/lib/account-type";
import {
  backendHttp,
  endBackendSession,
  startBackendSession,
} from "@/lib/client/backend-http";
import {
  readSession,
  signIn,
  signOut,
  signOutOfThisTab,
  switchSessionWorkspace,
} from "@/lib/client/session";
import {
  ACCOUNT_NOT_APPROVED,
  FORBIDDEN,
  REGISTRATION_REQUIRED,
  SESSION_REQUIRED,
} from "@/lib/const";
import { signOutOfFirebase } from "@/lib/firebase/auth";
import { Locale } from "@/lib/i18n";
import { LAST_WORKSPACE_KEY } from "@/lib/last-workspace";
import { MENTOR_REQUEST_NEED_DRAFT_KEY } from "@/lib/mentor-request-need";
import { SIGNED_IN_HINT_COOKIE } from "@/lib/session-hint";
import {
  isMarkedSignedOut,
  markSignedIn,
  markSignedOut,
} from "@/lib/session-signals";
import { createMentorResponse } from "@test/fixtures/mentors";
import { backendUser } from "@test/fixtures/session";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/firebase/auth", () => ({
  signOutOfFirebase: vi.fn(() => Promise.resolve()),
}));

const CALENDAR_TOKEN_KEY = "metual.googleCalendar.accessToken";

const TOKEN = { headers: { Authorization: "Bearer id-token" } };

/** Both a mentor and a startup's mentee, so there are two workspaces to choose between. */
const mentorAndFounder = backendUser({
  id: "user-7",
  fullName: "Leyla Aksoy",
  role: UserRole.Mentee,
  permissions: [UserRole.Mentee, UserRole.Mentor],
  organizationId: "org-1",
  organizationName: "Döngü",
  status: UserAccountStatus.Approved,
});

function answerMe(status: number, data: unknown = mentorAndFounder) {
  vi.mocked(backendHttp.get).mockResolvedValue(
    createMentorResponse(data, status),
  );
}

function cookie(name: string) {
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function clearCookies() {
  for (const name of [SIGNED_IN_HINT_COOKIE, ACCOUNT_TYPE_COOKIE]) {
    document.cookie = `${name}=; path=/; max-age=0`;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_EDITION", "TEKNOKENT");
  vi.mocked(backendHttp.put).mockResolvedValue(createMentorResponse(null, 204));
  vi.mocked(startBackendSession).mockResolvedValue(true);
});

afterEach(() => {
  clearCookies();
  markSignedIn();
  localStorage.clear();
  sessionStorage.clear();
});

describe("signIn", () => {
  it("reads the account with the sign-in's token, starts the API session and marks the browser signed in", async () => {
    answerMe(200);

    const session = await signIn("id-token", true);

    expect(backendHttp.get).toHaveBeenCalledWith("/api/auth/me", TOKEN);
    expect(startBackendSession).toHaveBeenCalledWith("id-token", true);
    expect(session).toMatchObject({
      userId: "user-7",
      role: UserRole.Mentee,
      organizationId: "org-1",
      edition: Edition.Teknokent,
    });
    expect(cookie(SIGNED_IN_HINT_COOKIE)).toBe(UserRole.Mentee);
    expect(cookie(ACCOUNT_TYPE_COOKIE)).toBeDefined();
  });

  it("lifts an earlier sign-out's mark, so a lost session can be resumed again", async () => {
    markSignedOut();
    answerMe(200);

    await signIn("id-token");

    expect(isMarkedSignedOut()).toBe(false);
  });

  it("keeps the mark when the sign-in is refused", async () => {
    markSignedOut();
    vi.mocked(startBackendSession).mockResolvedValue(false);
    answerMe(200);

    await expect(signIn("id-token")).rejects.toThrow();
    expect(isMarkedSignedOut()).toBe(true);
  });

  it("saves the screen's language with the token, and signs in even when that fails", async () => {
    answerMe(200);
    vi.mocked(backendHttp.put).mockRejectedValue(new Error("offline"));

    await expect(signIn("id-token")).resolves.toMatchObject({
      userId: "user-7",
    });
    expect(backendHttp.put).toHaveBeenCalledWith(
      "/api/auth/me/language",
      { language: Locale.Tr },
      TOKEN,
    );
    expect(startBackendSession).toHaveBeenCalledWith("id-token", false);
  });

  it("opens the workspace last switched to in this browser", async () => {
    localStorage.setItem(LAST_WORKSPACE_KEY, Workspace.GirisimMentor);
    answerMe(200);

    await expect(signIn("id-token")).resolves.toMatchObject({
      activeWorkspace: Workspace.GirisimMentor,
    });
  });

  it("ignores a remembered workspace the account cannot open", async () => {
    localStorage.setItem(LAST_WORKSPACE_KEY, Workspace.Admin);
    answerMe(200);

    const session = await signIn("id-token");

    expect(session.activeWorkspace).toBeUndefined();
  });

  it("sends a login without an account to registration, without a session", async () => {
    answerMe(401, {});

    await expect(signIn("id-token")).rejects.toMatchObject({
      status: 401,
      code: REGISTRATION_REQUIRED,
    });
    expect(startBackendSession).not.toHaveBeenCalled();
    expect(backendHttp.put).not.toHaveBeenCalled();
    expect(cookie(SIGNED_IN_HINT_COOKIE)).toBeUndefined();
  });

  it("refuses a sign-in the backend could not check, with its status", async () => {
    answerMe(503, {});

    await expect(signIn("id-token")).rejects.toMatchObject({
      status: 503,
      code: SESSION_REQUIRED,
    });
    expect(startBackendSession).not.toHaveBeenCalled();
  });

  it.each([
    [UserAccountStatus.Pending, "Hesabınız koordinatör onayı bekliyor."],
    [UserAccountStatus.Rejected, "Başvurunuz onaylanmadı."],
  ])(
    "keeps a %s account out, after saving its language for the decision mail",
    async (status, message) => {
      answerMe(200, { ...mentorAndFounder, status });

      await expect(signIn("id-token")).rejects.toMatchObject({
        status: 403,
        code: ACCOUNT_NOT_APPROVED,
        message,
      });
      expect(backendHttp.put).toHaveBeenCalled();
      expect(startBackendSession).not.toHaveBeenCalled();
      expect(cookie(SIGNED_IN_HINT_COOKIE)).toBeUndefined();
    },
  );

  it("fails when the API will not start its session, leaving the browser signed out", async () => {
    answerMe(200);
    vi.mocked(startBackendSession).mockResolvedValue(false);

    await expect(signIn("id-token")).rejects.toMatchObject({
      code: SESSION_REQUIRED,
    });
    expect(cookie(SIGNED_IN_HINT_COOKIE)).toBeUndefined();
  });
});

describe("readSession", () => {
  it("reads the account on the API's own cookie, naming nobody", async () => {
    answerMe(200);

    await expect(readSession()).resolves.toMatchObject({ userId: "user-7" });
    expect(backendHttp.get).toHaveBeenCalledWith("/api/auth/me");
  });

  it("gives a session resumed without signing in here its hint back", async () => {
    answerMe(200);

    await readSession();

    expect(cookie(SIGNED_IN_HINT_COOKIE)).toBe(UserRole.Mentee);
  });

  // The hint must outlive the browser as the sign-in asked, or the proxy would send a remembered person to log in.
  it("writes a lost hint back as lasting as this browser's last sign-in asked for", async () => {
    const written: string[] = [];
    const descriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      "cookie",
    )!;
    const spy = vi
      .spyOn(document, "cookie", "set")
      .mockImplementation((value: string) => {
        written.push(value);
        descriptor.set!.call(document, value);
      });
    answerMe(200);

    const lastHint = () =>
      written
        .filter((value) => value.startsWith(`${SIGNED_IN_HINT_COOKIE}=`))
        .at(-1);

    localStorage.setItem("menton_sign_in_remembered", "1");
    await readSession();
    expect(lastHint()).toContain(`${SIGNED_IN_HINT_COOKIE}=${UserRole.Mentee}`);
    expect(lastHint()).toContain("max-age=");

    document.cookie = `${SIGNED_IN_HINT_COOKIE}=; path=/; max-age=0`;
    localStorage.removeItem("menton_sign_in_remembered");
    await readSession();
    expect(lastHint()).toContain(`${SIGNED_IN_HINT_COOKIE}=${UserRole.Mentee}`);
    expect(lastHint()).not.toContain("max-age=");
    spy.mockRestore();
  });

  it("is null on a 401 and drops the hint, so the proxy stops treating the browser as signed in", async () => {
    document.cookie = `${SIGNED_IN_HINT_COOKIE}=${UserRole.Mentee}; path=/`;
    answerMe(401, {});

    await expect(readSession()).resolves.toBeNull();
    expect(cookie(SIGNED_IN_HINT_COOKIE)).toBeUndefined();
  });

  it("is null for an account that is no longer approved", async () => {
    answerMe(200, { ...mentorAndFounder, status: UserAccountStatus.Rejected });

    await expect(readSession()).resolves.toBeNull();
  });

  it("throws on any other failure, so a hiccup never reads as signed out", async () => {
    answerMe(503, {});

    await expect(readSession()).rejects.toMatchObject({ status: 503 });
  });

  it("builds the session under this deployment's edition", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_EDITION", "ODTU");
    answerMe(200, { ...mentorAndFounder, edition: Edition.Teknokent });

    await expect(readSession()).resolves.toMatchObject({
      edition: Edition.Odtu,
    });
  });
});

describe("switchSessionWorkspace", () => {
  it("opens a workspace the account can open and remembers it here", async () => {
    answerMe(200);

    await expect(
      switchSessionWorkspace(Workspace.GirisimMentor),
    ).resolves.toMatchObject({ activeWorkspace: Workspace.GirisimMentor });
    expect(localStorage.getItem(LAST_WORKSPACE_KEY)).toBe(
      Workspace.GirisimMentor,
    );
  });

  it("refuses a workspace the account cannot open", async () => {
    answerMe(200);

    await expect(switchSessionWorkspace(Workspace.Admin)).rejects.toMatchObject(
      { status: 403, code: FORBIDDEN },
    );
    expect(localStorage.getItem(LAST_WORKSPACE_KEY)).toBeNull();
  });

  it("refuses without a session", async () => {
    answerMe(401, {});

    await expect(
      switchSessionWorkspace(Workspace.GirisimMentor),
    ).rejects.toMatchObject({ status: 401, code: SESSION_REQUIRED });
  });
});

describe("signOut", () => {
  it("ends the API's session and drops the hint", async () => {
    document.cookie = `${SIGNED_IN_HINT_COOKIE}=${UserRole.Mentee}; path=/`;

    await signOut();

    expect(endBackendSession).toHaveBeenCalled();
    expect(cookie(SIGNED_IN_HINT_COOKIE)).toBeUndefined();
  });

  // Reported: with the API's cookie dropped first, a call landing before the Firebase sign-out answered 401 and
  // started a session again from the login still there.
  it("marks the browser signed out, then ends the Firebase login, then the API's cookie", async () => {
    const order: string[] = [];
    vi.mocked(signOutOfFirebase).mockImplementationOnce(async () => {
      order.push(`firebase (marked: ${isMarkedSignedOut()})`);
    });
    vi.mocked(endBackendSession).mockImplementationOnce(async () => {
      order.push("api");
    });

    await signOut();

    expect(order).toEqual(["firebase (marked: true)", "api"]);
  });

  it("finishes and keeps the mark when the Firebase sign-out fails, and says so", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(signOutOfFirebase).mockRejectedValueOnce(new Error("offline"));

    await expect(signOut()).resolves.toBeUndefined();

    expect(endBackendSession).toHaveBeenCalled();
    expect(isMarkedSignedOut()).toBe(true);
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  it("drops the person's Google Calendar access and mentor-request draft", async () => {
    sessionStorage.setItem(CALENDAR_TOKEN_KEY, "ya29.token");
    sessionStorage.setItem(MENTOR_REQUEST_NEED_DRAFT_KEY, "{}");

    await signOut();

    expect(sessionStorage.getItem(CALENDAR_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(MENTOR_REQUEST_NEED_DRAFT_KEY)).toBeNull();
  });

  it("reads no session afterwards without asking the API, whose cookie may still be on its way out", async () => {
    await signOut();
    answerMe(200);

    await expect(readSession()).resolves.toBeNull();
    expect(backendHttp.get).not.toHaveBeenCalled();
  });
});

describe("signOutOfThisTab", () => {
  it("ends this tab's own Firebase login and what it holds, leaving the API to the tab that signed out", async () => {
    sessionStorage.setItem(CALENDAR_TOKEN_KEY, "ya29.token");

    await signOutOfThisTab();

    expect(signOutOfFirebase).toHaveBeenCalled();
    expect(sessionStorage.getItem(CALENDAR_TOKEN_KEY)).toBeNull();
    expect(endBackendSession).not.toHaveBeenCalled();
  });
});
