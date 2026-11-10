import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as complete } from "@/app/api/institution-login/[provider]/complete/route";
import { POST as start } from "@/app/api/institution-login/[provider]/start/route";
import { GET as devPersonas } from "@/app/api/institution-login/dev-personas/route";
import { InstitutionProvider } from "@/interfaces/institution-login";
import { INSTITUTION_LOGIN_COOKIE } from "@/lib/server/institution-login-cookie";
import {
  exchangeInstitutionCode,
  fetchDevPersonas,
  finishInstitutionCallback,
  startInstitutionLogin,
} from "@/lib/api/institution-login";

vi.mock("@/lib/api/institution-login", () => ({
  startInstitutionLogin: vi.fn(),
  finishInstitutionCallback: vi.fn(),
  exchangeInstitutionCode: vi.fn(),
  fetchDevPersonas: vi.fn(),
}));

const provider = (name: string) => ({
  params: Promise.resolve({ provider: name }),
});

/** The cookie the start route left in the browser that began the login. */
function startedHere(
  state: string,
  provider = "odtu",
  next: string | null = null,
) {
  return `${INSTITUTION_LOGIN_COOKIE}=${encodeURIComponent(
    JSON.stringify({ provider, state, next }),
  )}`;
}

function completeRequest(
  body: unknown,
  cookie: string | null = startedHere("s-1"),
) {
  return new NextRequest(
    "http://localhost/api/institution-login/odtu/complete",
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: cookie ? { cookie } : {},
    },
  );
}

function bindingCookie(response: Response) {
  return response.headers.get("set-cookie") ?? "";
}

describe("institution login routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("starts an ODTÜ login and refuses institutions it does not know", async () => {
    vi.mocked(startInstitutionLogin).mockResolvedValue({
      status: 200,
      data: { redirectUrl: "/login/odtu/dev?state=s-1", state: "s-1" },
      headers: {},
    });

    const response = await start(
      new Request("http://localhost"),
      provider("odtu"),
    );
    expect(await response.json()).toEqual({
      redirectUrl: "/login/odtu/dev?state=s-1",
      state: "s-1",
    });
    expect(startInstitutionLogin).toHaveBeenCalledWith(
      InstitutionProvider.Odtu,
    );
    const cookie = bindingCookie(response);
    expect(cookie).toContain(`${INSTITUTION_LOGIN_COOKIE}=`);
    expect(cookie).toContain(encodeURIComponent('"state":"s-1"'));
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");

    expect(
      (await start(new Request("http://localhost"), provider("boun"))).status,
    ).toBe(404);
  });

  // The one-time code is traded on the server, so the browser only ever sees the custom token.
  it("trades the callback's one-time code for the custom token in one call", async () => {
    vi.mocked(finishInstitutionCallback).mockResolvedValue({
      status: 200,
      data: { code: "code-1" },
      headers: {},
    });
    vi.mocked(exchangeInstitutionCode).mockResolvedValue({
      status: 200,
      data: { customToken: "custom-1" },
      headers: {},
    });

    const response = await complete(
      completeRequest({ state: "s-1", params: { persona: "dev-ogrenci-1" } }),
      provider("odtu"),
    );

    expect(await response.json()).toEqual({
      customToken: "custom-1",
      next: null,
    });
    expect(bindingCookie(response)).toContain(`${INSTITUTION_LOGIN_COOKIE}=;`);
    // Whoever was signed in on this browser before is signed out first.
    expect(bindingCookie(response)).toContain("teknokent_session=;");
    expect(finishInstitutionCallback).toHaveBeenCalledWith(
      InstitutionProvider.Odtu,
      "s-1",
      { persona: "dev-ogrenci-1" },
    );
    expect(exchangeInstitutionCode).toHaveBeenCalledWith("code-1");
  });

  it("passes the backend's refusal through without asking for a token", async () => {
    vi.mocked(finishInstitutionCallback).mockResolvedValue({
      status: 403,
      data: { message: "Bu hesap için menton erişimi bulunamadı." },
      headers: {},
    });

    const response = await complete(
      completeRequest({ state: "s-1", params: { persona: "dev-personel-1" } }),
      provider("odtu"),
    );

    expect(response.status).toBe(403);
    expect((await response.json()).message).toBe(
      "Bu hesap için menton erişimi bulunamadı.",
    );
    expect(exchangeInstitutionCode).not.toHaveBeenCalled();
  });

  it("refuses a completion without a state or with non-text parameters", async () => {
    expect(
      (await complete(completeRequest({ params: {} }), provider("odtu")))
        .status,
    ).toBe(400);
    expect(
      (
        await complete(
          completeRequest({ state: "s-1", params: { persona: 1 } }),
          provider("odtu"),
        )
      ).status,
    ).toBe(400);
    expect(finishInstitutionCallback).not.toHaveBeenCalled();
  });

  // Login CSRF: a callback link from someone else's login carries a valid state, but this browser never started it.
  it("refuses a completion this browser did not start", async () => {
    for (const cookie of [
      null,
      startedHere("someone-elses-state"),
      startedHere("s-1", "otg"),
      `${INSTITUTION_LOGIN_COOKIE}=not-json`,
    ]) {
      const response = await complete(
        completeRequest({ state: "s-1", params: { persona: "p" } }, cookie),
        provider("odtu"),
      );
      expect(response.status).toBe(400);
      expect(bindingCookie(response)).toContain(
        `${INSTITUTION_LOGIN_COOKIE}=;`,
      );
    }
    expect(finishInstitutionCallback).not.toHaveBeenCalled();
  });

  it("forgets the login when the backend cannot be reached", async () => {
    vi.mocked(finishInstitutionCallback).mockRejectedValue(new Error("down"));

    const response = await complete(
      completeRequest({ state: "s-1", params: { persona: "p" } }),
      provider("odtu"),
    );

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(bindingCookie(response)).toContain(`${INSTITUTION_LOGIN_COOKIE}=;`);
    expect(bindingCookie(response)).not.toContain("teknokent_session");
  });

  it("hands back the in-app path the login was started for, never another site", async () => {
    vi.mocked(finishInstitutionCallback).mockResolvedValue({
      status: 200,
      data: { code: "code-1" },
      headers: {},
    });
    vi.mocked(exchangeInstitutionCode).mockResolvedValue({
      status: 200,
      data: { customToken: "custom-1" },
      headers: {},
    });

    const toProgram = await complete(
      completeRequest(
        { state: "s-1", params: { code: "c" } },
        startedHere("s-1", "otg", "/programs/42"),
      ),
      provider("otg"),
    );
    expect((await toProgram.json()).next).toBe("/programs/42");

    const elsewhere = await complete(
      completeRequest(
        { state: "s-1", params: { code: "c" } },
        startedHere("s-1", "otg", "/\\evil.example"),
      ),
      provider("otg"),
    );
    expect((await elsewhere.json()).next).toBeNull();
  });

  it("lists the dev personas only while the dev login is switched on", async () => {
    vi.mocked(fetchDevPersonas).mockResolvedValue({
      status: 200,
      data: [],
      headers: {},
    });

    expect((await devPersonas()).status).toBe(404);
    expect(fetchDevPersonas).not.toHaveBeenCalled();

    vi.stubEnv("NEXT_PUBLIC_ODTU_DEV_LOGIN", "true");
    expect((await devPersonas()).status).toBe(200);
  });
});
