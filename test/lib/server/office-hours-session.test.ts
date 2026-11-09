import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOfficeHoursUser,
  saveOfficeHoursUser,
} from "@/lib/server/office-hours-session";

const store: { user?: unknown; issuedAt?: number; save: () => Promise<void> } =
  { save: vi.fn().mockResolvedValue(undefined) };
const getIronSession = vi.fn();

vi.mock("iron-session", () => ({
  getIronSession: (...args: unknown[]) => getIronSession(...args),
}));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({}) }));

describe("office-hours session", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_PASSWORD", "x".repeat(32));
    delete store.user;
    delete store.issuedAt;
    getIronSession.mockResolvedValue(store);
  });

  it("keeps its own cookie, apart from the Menton session", async () => {
    await saveOfficeHoursUser({ userId: "u1", fullName: "Ayşe Yılmaz" });

    const options = getIronSession.mock.calls[0][1];
    expect(options.cookieName).toBe("menton_office_hours");
    expect(options.cookieOptions.httpOnly).toBe(true);
    expect(store.user).toEqual({ userId: "u1", fullName: "Ayşe Yılmaz" });
    expect(store.save).toHaveBeenCalled();
  });

  it("reads the person back while the session is fresh", async () => {
    store.user = { userId: "u1", fullName: "Ayşe Yılmaz" };
    store.issuedAt = 1_000_000;

    expect(await getOfficeHoursUser(1_000_000 + 60_000)).toEqual({
      userId: "u1",
      fullName: "Ayşe Yılmaz",
    });
  });

  it("treats an old or unstamped session as signed out", async () => {
    store.user = { userId: "u1", fullName: "Ayşe Yılmaz" };
    store.issuedAt = 0;
    expect(await getOfficeHoursUser(9 * 60 * 60 * 1000)).toBeNull();

    delete store.issuedAt;
    expect(await getOfficeHoursUser()).toBeNull();
  });
});
