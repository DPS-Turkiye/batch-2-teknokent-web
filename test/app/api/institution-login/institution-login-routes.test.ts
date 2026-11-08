import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as complete } from "@/app/api/institution-login/[provider]/complete/route";
import { POST as start } from "@/app/api/institution-login/[provider]/start/route";
import { GET as devPersonas } from "@/app/api/institution-login/dev-personas/route";
import { InstitutionProvider } from "@/interfaces/institution-login";
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

function completeRequest(body: unknown) {
  return new NextRequest(
    "http://localhost/api/institution-login/odtu/complete",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
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

    expect(await response.json()).toEqual({ customToken: "custom-1" });
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
