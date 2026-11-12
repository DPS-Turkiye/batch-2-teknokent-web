import { afterEach, describe, expect, it, vi } from "vitest";

import { Edition } from "@/interfaces/edition";
import { appEdition, requireEdition } from "@/lib/server/edition";

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

describe("appEdition", () => {
  it("is Teknokent unless APP_EDITION says otherwise", () => {
    vi.stubEnv("APP_EDITION", undefined);
    expect(appEdition()).toBe(Edition.Teknokent);
    vi.stubEnv("APP_EDITION", "ODTU");
    expect(appEdition()).toBe(Edition.Odtu);
  });
});

describe("requireEdition", () => {
  it("lets the request on in its own edition", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    await expect(requireEdition(Edition.Odtu)).resolves.toBeUndefined();
  });

  it("answers like a missing route in the other edition", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    await expect(requireEdition(Edition.Teknokent)).rejects.toThrow(NotFound);
  });
});
