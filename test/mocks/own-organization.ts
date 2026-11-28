import { vi } from "vitest";

/** The signed-in person's startup that a mocked `ownOrganizationId` answers. */
export const OWN_ORGANIZATION_ID = "org/1";
/** Its path, as `ownOrganizationPath` builds it. */
export const OWN_ORGANIZATION_PATH = "/api/organizations/org%2F1";

/** A stand-in for `@/lib/client/own-organization`, for `vi.mock("@/lib/client/own-organization", ...)`. */
export function ownOrganizationMock() {
  return {
    ownOrganizationId: vi.fn(() => Promise.resolve(OWN_ORGANIZATION_ID)),
    ownOrganizationPath: vi.fn((suffix = "") =>
      Promise.resolve(`${OWN_ORGANIZATION_PATH}${suffix}`),
    ),
  };
}
