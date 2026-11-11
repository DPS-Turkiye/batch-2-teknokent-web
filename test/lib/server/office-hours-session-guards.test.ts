import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOfficeHoursUser,
  requireOfficeHoursUser,
  saveOfficeHoursUser,
} from "@/lib/server/office-hours-session";
import { SessionRequiredError } from "@/lib/server/session-error";

const store: { user?: unknown; issuedAt?: number; save: () => Promise<void> } =
  { save: vi.fn().mockResolvedValue(undefined) };
const getIronSession = vi.fn();

vi.mock("iron-session", () => ({
  getIronSession: (...args: unknown[]) => getIronSession(...args),
}));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({}) }));

const user = { userId: "u1", fullName: "Ayşe Yılmaz" };

function cookieOptions(): unknown {
  const call = getIronSession.mock.lastCall;
  if (!call) throw new Error("getIronSession was not called");
  const options: unknown = call[1];
  return options;
}

describe("office-hours session guards", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_PASSWORD", "x".repeat(32));
    delete store.user;
    delete store.issuedAt;
    getIronSession.mockReset();
    getIronSession.mockResolvedValue(store);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses to open a session with a password shorter than 32 characters", async () => {
    vi.stubEnv("SESSION_PASSWORD", "x".repeat(31));

    await expect(getOfficeHoursUser()).rejects.toThrow(
      "SESSION_PASSWORD must contain at least 32 characters.",
    );
    expect(getIronSession).not.toHaveBeenCalled();
  });

  it("refuses to open a session without a password", async () => {
    vi.stubEnv("SESSION_PASSWORD", "");

    await expect(saveOfficeHoursUser(user)).rejects.toThrow(/SESSION_PASSWORD/);
  });

  it("sends the cookie cross-site in production, so it travels inside Moodle's frame", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await getOfficeHoursUser();

    expect(cookieOptions()).toMatchObject({
      cookieOptions: { sameSite: "none", secure: true },
    });
  });

  it("keeps the cookie same-site and insecure in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await getOfficeHoursUser();

    expect(cookieOptions()).toMatchObject({
      cookieOptions: { sameSite: "lax", secure: false },
    });
  });

  it("hands a route the signed-in person", async () => {
    store.user = user;
    store.issuedAt = Date.now();

    await expect(requireOfficeHoursUser()).resolves.toEqual(user);
  });

  it("throws SessionRequiredError for a route without a session, so it answers 401", async () => {
    await expect(requireOfficeHoursUser()).rejects.toBeInstanceOf(
      SessionRequiredError,
    );
  });

  it("tolerates a clock up to a minute behind the one that stamped the session", async () => {
    store.user = user;
    store.issuedAt = 1_000_000;

    expect(await getOfficeHoursUser(1_000_000 - 59_000)).toEqual(user);
    expect(await getOfficeHoursUser(1_000_000 - 61_000)).toBeNull();
  });
});
