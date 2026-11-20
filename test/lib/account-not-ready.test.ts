import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  accountNotReadyHref,
  clearStaleDraft,
  existingAccountHref,
} from "@/lib/account-not-ready";
import { ClientApiError } from "@/lib/client/api";
import {
  clearOnboardingDraft,
  fetchOnboardingDraft,
} from "@/lib/client/onboarding-draft";
import { ACCOUNT_NOT_APPROVED, REGISTRATION_REQUIRED } from "@/lib/const";
import { saveInviteIntent } from "@/lib/invite-intent";

vi.mock("@/lib/client/onboarding-draft", () => ({
  clearOnboardingDraft: vi.fn(),
  fetchOnboardingDraft: vi.fn(),
}));

const pending = new ClientApiError("pending", 403, ACCOUNT_NOT_APPROVED);
const unregistered = new ClientApiError("none", 401, REGISTRATION_REQUIRED);
const founderDraft = { kind: "signup-wizard", step: "4", payload: {} } as const;
const mentorDraft = {
  kind: "mentor-onboarding",
  step: "profile",
  payload: {},
} as const;

describe("accountNotReadyHref", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(null);
    vi.mocked(clearOnboardingDraft).mockResolvedValue(undefined);
    window.localStorage.clear();
  });

  it("leaves other errors alone", async () => {
    await expect(accountNotReadyHref(new Error("x"), "t")).resolves.toBeNull();
    await expect(
      accountNotReadyHref(new ClientApiError("x", 500), "t"),
    ).resolves.toBeNull();
  });

  it("sends a pending account to its status page", async () => {
    await expect(accountNotReadyHref(pending, "t")).resolves.toBe(
      "/application-status",
    );
    expect(clearOnboardingDraft).not.toHaveBeenCalled();
  });

  it("breaks the loop: a pending founder with a leftover draft goes to the status page and the draft is dropped", async () => {
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(founderDraft);

    await expect(accountNotReadyHref(pending, "t")).resolves.toBe(
      "/application-status",
    );
    expect(clearOnboardingDraft).toHaveBeenCalledWith("t");
  });

  it("still reaches the status page when the leftover draft cannot be dropped", async () => {
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(founderDraft);
    vi.mocked(clearOnboardingDraft).mockRejectedValue(new Error("down"));

    await expect(accountNotReadyHref(pending, "t")).resolves.toBe(
      "/application-status",
    );
  });

  it("returns a pending mentor to the onboarding they have not finished", async () => {
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(mentorDraft);

    await expect(accountNotReadyHref(pending, "t")).resolves.toBe(
      "/signup?resume=1&role=mentor",
    );
    expect(clearOnboardingDraft).not.toHaveBeenCalled();
  });

  it("resumes an unfinished registration in its wizard, or on the role page without a draft", async () => {
    await expect(accountNotReadyHref(unregistered, "t")).resolves.toBe(
      "/signup?resume=1",
    );
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(founderDraft);
    await expect(accountNotReadyHref(unregistered, "t")).resolves.toBe(
      "/signup?resume=1&role=founder",
    );
    expect(clearOnboardingDraft).not.toHaveBeenCalled();
  });

  it("sends a login that entered a team code back to /invite, not to the founder and mentor sign-up", async () => {
    saveInviteIntent("ABCD2345");

    await expect(accountNotReadyHref(unregistered, "t")).resolves.toBe(
      "/invite?code=ABCD2345&resume=1",
    );
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(founderDraft);
    await expect(accountNotReadyHref(unregistered, "t")).resolves.toBe(
      "/invite?code=ABCD2345&resume=1",
    );
  });

  it("keeps a mentor's onboarding and a pending account's status page ahead of a saved code", async () => {
    saveInviteIntent("ABCD2345");
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(mentorDraft);

    await expect(accountNotReadyHref(unregistered, "t")).resolves.toBe(
      "/signup?resume=1&role=mentor",
    );
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(null);
    await expect(accountNotReadyHref(pending, "t")).resolves.toBe(
      "/application-status",
    );
  });

  it("routes without a token, or when the draft cannot be read", async () => {
    await expect(accountNotReadyHref(pending, null)).resolves.toBe(
      "/application-status",
    );
    expect(fetchOnboardingDraft).not.toHaveBeenCalled();
    vi.mocked(fetchOnboardingDraft).mockRejectedValue(new Error("down"));
    await expect(accountNotReadyHref(pending, "t")).resolves.toBe(
      "/application-status",
    );
  });
});

describe("clearStaleDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clearOnboardingDraft).mockResolvedValue(undefined);
  });

  it("drops a founder draft and keeps a mentor's", async () => {
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(founderDraft);
    await clearStaleDraft("t");
    expect(clearOnboardingDraft).toHaveBeenCalledWith("t");

    vi.mocked(clearOnboardingDraft).mockClear();
    vi.mocked(fetchOnboardingDraft).mockResolvedValue(mentorDraft);
    await clearStaleDraft("t");
    expect(clearOnboardingDraft).not.toHaveBeenCalled();
  });
});

describe("existingAccountHref", () => {
  it("sends a waiting or refused account to its status page, anyone else to sign in", () => {
    const founder = (status?: UserAccountStatus) => ({
      role: UserRole.Mentee,
      ...(status ? { status } : {}),
    });
    expect(existingAccountHref(founder(UserAccountStatus.Pending))).toBe(
      "/application-status",
    );
    expect(existingAccountHref(founder(UserAccountStatus.Rejected))).toBe(
      "/application-status",
    );
    expect(existingAccountHref(founder(UserAccountStatus.Approved))).toBe(
      "/login",
    );
    expect(existingAccountHref(founder())).toBe("/login");
    expect(existingAccountHref(null)).toBe("/login");
  });

  it("sends a pending mentor to sign in, which is what returns them to their onboarding", () => {
    expect(
      existingAccountHref({
        role: UserRole.Mentor,
        status: UserAccountStatus.Pending,
      }),
    ).toBe("/login");
  });
});
