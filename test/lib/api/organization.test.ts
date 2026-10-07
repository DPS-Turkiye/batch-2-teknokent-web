import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  StartupProfileInput,
  StartupStatusInput,
} from "@/interfaces/organization";
import {
  updateOrganization,
  updateOrganizationStatus,
} from "@/lib/api/organization";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

// A body field named actorId must not replace the session user the backend
// authorizes on.
const spoofed = { actorId: "lead-1" };

describe("organization server API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the session actor on a profile update", async () => {
    await updateOrganization("org-1", "member-1", {
      ...spoofed,
    } as unknown as StartupProfileInput);

    expect(vi.mocked(backendRequest).mock.calls[0][0].data).toMatchObject({
      actorId: "member-1",
    });
  });

  it("keeps the session actor on a status update", async () => {
    await updateOrganizationStatus("org-1", "member-1", {
      ...spoofed,
    } as unknown as StartupStatusInput);

    expect(vi.mocked(backendRequest).mock.calls[0][0].data).toMatchObject({
      actorId: "member-1",
    });
  });
});
