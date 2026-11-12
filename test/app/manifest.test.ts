import { afterEach, describe, expect, it, vi } from "vitest";

import manifest from "@/app/manifest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("web app manifest", () => {
  it("installs the phone app as a standalone Menton that opens on /m", async () => {
    const result = await manifest();

    expect(result.name).toBe("Menton");
    expect(result.start_url).toBe("/m");
    expect(result.display).toBe("standalone");
    expect(result.description).toBe(
      "Mentorluk görüşmelerin, görevlerin ve mesajların cebinde.",
    );
    expect(result.icons?.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(["192x192", "512x512"]),
    );
  });

  it("opens on the home page in the ODTÜ edition, which has no phone app", async () => {
    vi.stubEnv("APP_EDITION", "ODTU");
    expect((await manifest()).start_url).toBe("/");
  });
});
