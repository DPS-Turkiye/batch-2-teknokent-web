import type {
  FounderChangeOptions,
  FounderChangePerson,
  FounderChangeResult,
} from "@/interfaces/founder-change";

export function founderChangePerson(
  overrides: Partial<FounderChangePerson> = {},
): FounderChangePerson {
  return {
    id: "member-1",
    fullName: "Zeynep Beyza Takkabulan",
    jobTitle: "Ürün",
    ...overrides,
  };
}

/** Yıldız Team, founded by Merve Geçer, with two approved members who may take over. */
export function founderChangeOptions(
  overrides: Partial<FounderChangeOptions> = {},
): FounderChangeOptions {
  return {
    organizationId: "org-1",
    name: "Yıldız Team",
    currentFounder: founderChangePerson({
      id: "founder-1",
      fullName: "Merve Geçer",
      jobTitle: null,
    }),
    candidates: [
      founderChangePerson({
        id: "member-2",
        fullName: "Ayşe Çelik",
        jobTitle: null,
      }),
      founderChangePerson(),
    ],
    ...overrides,
  };
}

export function founderChangeResult(
  overrides: Partial<FounderChangeResult> = {},
): FounderChangeResult {
  return {
    organizationId: "org-1",
    previousFounderId: "founder-1",
    founderId: "member-1",
    changedAt: "2026-11-20T12:00:00Z",
    ...overrides,
  };
}
