import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole, type AppSession } from "@/interfaces/session";
import { fetchOrganizationPrograms } from "@/lib/api/programs";
import {
  isIndividualMentee,
  redirectIndividualMentee,
} from "@/lib/server/individual-program";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/programs", () => ({ fetchOrganizationPrograms: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("REDIRECT:" + path);
  },
}));

type Programs = Awaited<ReturnType<typeof fetchOrganizationPrograms>>;

const program = (id: string, individualMentees: boolean) => ({
  id,
  name: id,
  coordinatorName: "Elif",
  individualMentees,
});

function answer(status: number, activeProgramId: string | null = "iskur") {
  const response: Programs = {
    status,
    headers: {},
    data: {
      programs: [program("growth", false), program("iskur", true)],
      activeProgramId,
    },
  };
  vi.mocked(fetchOrganizationPrograms).mockResolvedValue(response);
}

// Each test signs in a different user, since the answer is cached per user for one request.
function mentee(userId: string): AppSession {
  return {
    userId,
    email: `${userId}@metu.edu.tr`,
    fullName: userId,
    jobTitle: "Öğrenci",
    role: UserRole.Mentee,
    organizationId: `org-${userId}`,
  };
}

describe("isIndividualMentee", () => {
  beforeEach(() => vi.clearAllMocks());

  it("follows the mentee's current program", async () => {
    answer(200, "iskur");
    expect(await isIndividualMentee(mentee("a"))).toBe(true);

    answer(200, "growth");
    expect(await isIndividualMentee(mentee("b"))).toBe(false);
  });

  it("counts a failed lookup as not individual", async () => {
    answer(500);
    expect(await isIndividualMentee(mentee("c"))).toBe(false);

    vi.mocked(fetchOrganizationPrograms).mockRejectedValue(new Error("down"));
    expect(await isIndividualMentee(mentee("d"))).toBe(false);
  });

  it("never asks for anyone but a mentee with a team", async () => {
    expect(
      await isIndividualMentee({ ...mentee("e"), role: UserRole.Mentor }),
    ).toBe(false);
    const { organizationId: _organizationId, ...withoutTeam } = mentee("f");
    expect(await isIndividualMentee(withoutTeam)).toBe(false);
    expect(await isIndividualMentee(null)).toBe(false);
    expect(fetchOrganizationPrograms).not.toHaveBeenCalled();
  });
});

describe("redirectIndividualMentee", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends a student to Projem and lets a startup through", async () => {
    answer(200, "iskur");
    vi.mocked(getSessionUser).mockResolvedValue(mentee("g"));
    await expect(redirectIndividualMentee()).rejects.toThrow(
      "REDIRECT:/startup/process",
    );

    answer(200, "growth");
    vi.mocked(getSessionUser).mockResolvedValue(mentee("h"));
    await expect(redirectIndividualMentee()).resolves.toBeUndefined();
  });
});
