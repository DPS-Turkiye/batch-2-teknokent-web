import { beforeEach, describe, expect, it, vi } from "vitest";

import { InstitutionProvider } from "@/interfaces/institution-login";
import { backendHttp } from "@/lib/client/backend-http";
import {
  completeInstitutionLogin,
  fetchDevPersonas,
  startInstitutionLogin,
} from "@/lib/client/institution-login";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.mocked(backendHttp.post).mockResolvedValue({
    status: 200,
    data: { redirectUrl: "https://otg.example/auth", state: "s1" },
  });
});

describe("institution login, straight to the backend", () => {
  it("starts at the backend, which binds the login to this browser", async () => {
    expect(await startInstitutionLogin(InstitutionProvider.Otg)).toEqual({
      redirectUrl: "https://otg.example/auth",
      state: "s1",
    });

    expect(backendHttp.post).toHaveBeenCalledWith(
      `/api/auth/institution/${InstitutionProvider.Otg}/start`,
    );
  });

  it("keeps an in-app next path in this tab for the way back, once", async () => {
    await startInstitutionLogin(InstitutionProvider.Otg, "/mentors?x=1");
    vi.mocked(backendHttp.post).mockResolvedValue({
      status: 200,
      data: { customToken: "custom" },
    });

    expect(
      await completeInstitutionLogin(InstitutionProvider.Otg, "s1", {
        code: "c",
      }),
    ).toEqual({ customToken: "custom", next: "/mentors?x=1" });
    expect(backendHttp.post).toHaveBeenLastCalledWith(
      `/api/auth/institution/${InstitutionProvider.Otg}/complete`,
      { state: "s1", params: { code: "c" } },
    );

    const again = await completeInstitutionLogin(
      InstitutionProvider.Otg,
      "s1",
      { code: "c" },
    );
    expect(again.next).toBeNull();
  });

  it("never keeps a next that leaves the app", async () => {
    await startInstitutionLogin(
      InstitutionProvider.Otg,
      "https://evil.example",
    );
    vi.mocked(backendHttp.post).mockResolvedValue({
      status: 200,
      data: { customToken: "custom" },
    });

    const { next } = await completeInstitutionLogin(
      InstitutionProvider.Otg,
      "s1",
      {},
    );
    expect(next).toBeNull();
  });

  it("turns a refused callback into an error", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue({ status: 400, data: {} });

    await expect(
      completeInstitutionLogin(InstitutionProvider.Odtu, "s1", {}),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("reads the dev personas from the backend", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({ status: 200, data: [] });

    await fetchDevPersonas();

    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/auth/institution/odtu/dev-personas",
    );
  });
});
