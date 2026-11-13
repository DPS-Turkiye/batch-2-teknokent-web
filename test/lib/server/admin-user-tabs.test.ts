import { afterEach, describe, expect, it, vi } from "vitest";

import { requireAdminUserTab } from "@/lib/server/admin-user-tabs";
import { UserTab } from "@/types/admin-users";

class NotFound extends Error {}

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFound();
  },
}));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireAdminUserTab", () => {
  it("opens the tabs the edition shows and answers the others like a missing route", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    await expect(
      requireAdminUserTab(UserTab.Students),
    ).resolves.toBeUndefined();
    await expect(
      requireAdminUserTab(UserTab.Academics),
    ).resolves.toBeUndefined();
    await expect(requireAdminUserTab(UserTab.Mentors)).rejects.toThrow(
      NotFound,
    );
    await expect(requireAdminUserTab(UserTab.Teams)).rejects.toThrow(NotFound);

    vi.stubEnv("APP_EDITION", "TEKNOKENT");
    await expect(requireAdminUserTab(UserTab.Mentors)).resolves.toBeUndefined();
    await expect(requireAdminUserTab(UserTab.Students)).rejects.toThrow(
      NotFound,
    );
    await expect(requireAdminUserTab(UserTab.Academics)).rejects.toThrow(
      NotFound,
    );
  });
});
