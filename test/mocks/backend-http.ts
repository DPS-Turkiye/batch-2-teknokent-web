import { vi } from "vitest";

/** The signed-in person's id that a mocked `signedInUserId` answers. */
export const SIGNED_IN_USER_ID = "user/1";

/**
 * A stand-in for `@/lib/client/backend-http`, for `vi.mock("@/lib/client/backend-http", () => backendHttpMock())`.
 * Calls are recorded on `backendHttp`; `withToken` behaves like the real one.
 */
export function backendHttpMock() {
  return {
    backendHttp: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    signedInUserId: vi.fn(() => Promise.resolve(SIGNED_IN_USER_ID)),
    startBackendSession: vi.fn(() => Promise.resolve(true)),
    endBackendSession: vi.fn(() => Promise.resolve()),
    withToken: (idToken?: string) =>
      idToken ? { headers: { Authorization: `Bearer ${idToken}` } } : undefined,
  };
}
