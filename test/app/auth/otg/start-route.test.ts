import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET as start } from "@/app/auth/otg/start/route";
import { InstitutionProvider } from "@/interfaces/institution-login";
import { startInstitutionLogin } from "@/lib/api/institution-login";
import { INSTITUTION_LOGIN_COOKIE } from "@/lib/server/institution-login-cookie";

vi.mock("@/lib/api/institution-login", () => ({
  startInstitutionLogin: vi.fn(),
}));

const OTG_AUTHORIZE =
  "https://girisimcilik.odtuteknokent.com.tr/auth/v1/oauth/authorize?state=s-1";

function open(query = "") {
  return start(new NextRequest(`http://localhost:3000/auth/otg/start${query}`));
}

function savedLogin(response: Response) {
  const cookie = response.headers.get("set-cookie") ?? "";
  const value = cookie.split(";")[0].split("=").slice(1).join("=");
  return JSON.parse(decodeURIComponent(value));
}

describe("GET /auth/otg/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_OTG_LOGIN_ENABLED", "true");
    vi.mocked(startInstitutionLogin).mockResolvedValue({
      status: 200,
      data: { redirectUrl: OTG_AUTHORIZE, state: "s-1" },
      headers: {},
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not exist on a deployment where OTG login is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_OTG_LOGIN_ENABLED", "");

    expect((await open()).status).toBe(404);
    expect(startInstitutionLogin).not.toHaveBeenCalled();
  });

  // OTG's own "Menton'a git" button opens this path with no parameters at all.
  it("sends the browser to OTG and binds the login to it, with no parameters", async () => {
    const response = await open();

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe(OTG_AUTHORIZE);
    expect(startInstitutionLogin).toHaveBeenCalledWith(InstitutionProvider.Otg);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${INSTITUTION_LOGIN_COOKIE}=`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(savedLogin(response)).toEqual({
      provider: "otg",
      state: "s-1",
      next: null,
    });
  });

  it("keeps an in-app ?next= and drops anything that leaves the site", async () => {
    expect(savedLogin(await open("?next=%2Fprograms%2F42")).next).toBe(
      "/programs/42",
    );
    for (const next of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
    ]) {
      expect(
        savedLogin(await open(`?next=${encodeURIComponent(next)}`)).next,
      ).toBeNull();
    }
  });

  it("goes back to the login page when the backend cannot start the login", async () => {
    const refusal: Awaited<ReturnType<typeof startInstitutionLogin>> = {
      status: 404,
      data: { redirectUrl: "", state: "" },
      headers: {},
    };
    vi.mocked(startInstitutionLogin).mockResolvedValueOnce(refusal);
    const refused = await open();
    expect(refused.headers.get("location")).toBe(
      "http://localhost:3000/login?otg=hata",
    );
    expect(refused.headers.get("set-cookie")).toBeNull();

    vi.mocked(startInstitutionLogin).mockRejectedValueOnce(new Error("down"));
    expect((await open("?next=%2Fprograms%2F42")).headers.get("location")).toBe(
      "http://localhost:3000/login?otg=hata&next=%2Fprograms%2F42",
    );
  });

  it("never follows a redirect that is not https", async () => {
    vi.mocked(startInstitutionLogin).mockResolvedValueOnce({
      status: 200,
      data: { redirectUrl: "http://evil.example/authorize", state: "s-1" },
      headers: {},
    });

    expect((await open()).headers.get("location")).toBe(
      "http://localhost:3000/login?otg=hata",
    );
  });
});
