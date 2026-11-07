import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

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
});
