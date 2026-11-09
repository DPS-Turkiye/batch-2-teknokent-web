import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrganizationMemberInput } from "@/interfaces/organization-member";
import { createOrganizationMember } from "@/lib/api/organization-members";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("organization members server API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the session user as the actor the backend checks for founder rights", async () => {
    await createOrganizationMember("org-1", "founder-1", {
      fullName: "Yeni Üye",
      email: "yeni@x.demo",
      actorId: "someone-else",
    } as unknown as OrganizationMemberInput);

    expect(vi.mocked(backendRequest).mock.calls[0][0]).toMatchObject({
      method: "POST",
      url: "/api/organizations/org-1/members",
      data: {
        fullName: "Yeni Üye",
        email: "yeni@x.demo",
        actorId: "founder-1",
      },
    });
  });
});
