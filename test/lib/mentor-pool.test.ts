import { describe, expect, it } from "vitest";

import { MentorPoolStatus, type MentorPoolRow } from "@/interfaces/mentor-pool";
import {
  CapacityFilter,
  expertiseOptions,
  filterPool,
  loadShare,
  mentorInviteLink,
  PoolFilter,
  poolFilterOptions,
  poolRowNote,
  profileMentorId,
} from "@/lib/mentor-pool";
import { translatorIn } from "@test/translators";

const t = translatorIn("tr", "programMentors");
const tEn = translatorIn("en", "programMentors");

function row(overrides: Partial<MentorPoolRow> = {}): MentorPoolRow {
  return {
    mentorId: "mentor-1",
    inviteId: null,
    fullName: "Nihan Öztürk",
    email: "nihan@ozturk.design",
    status: MentorPoolStatus.Active,
    expertise: ["UX/UI Design", "Ürün stratejisi"],
    programs: ["METU Stars"],
    activeTeams: 3,
    capacity: 4,
    since: "2026-09-20T10:00:00Z",
    expiresAt: null,
    inviteCode: null,
    ...overrides,
  };
}

const active = row();
const full = row({
  mentorId: "mentor-2",
  fullName: "Kerem Sarı",
  status: MentorPoolStatus.Full,
  expertise: ["Büyüme"],
});
const awaitingApproval = row({
  mentorId: "mentor-3",
  fullName: "Zeynep Arslan",
  status: MentorPoolStatus.AwaitingApproval,
  expertise: ["Hukuk"],
});
const expiringInvite = row({
  mentorId: null,
  inviteId: "invite-1",
  fullName: null,
  email: "murat.koc@mail.com",
  status: MentorPoolStatus.InviteExpiring,
  expertise: [],
  inviteCode: "abc",
  since: "2026-09-20T10:00:00Z",
  expiresAt: "2026-09-27T10:00:00Z",
});
const rows = [active, full, awaitingApproval, expiringInvite];

describe("mentor pool helpers", () => {
  it("counts each filter and narrows by status, expertise, capacity and search", () => {
    expect(poolFilterOptions(rows, tEn).map((option) => option.label)).toEqual([
      "All 4",
      "Active 2",
      "Invited 1",
      "To approve 1",
    ]);
    expect(poolFilterOptions(rows, t).map((option) => option.label)).toEqual([
      "Tümü 4",
      "Aktif 2",
      "Davet bekliyor 1",
      "Onay bekliyor 1",
    ]);
    const base = {
      filter: PoolFilter.All,
      search: "",
      expertise: "",
      capacity: CapacityFilter.All,
    };
    expect(filterPool(rows, { ...base, filter: PoolFilter.Invited })).toEqual([
      expiringInvite,
    ]);
    expect(filterPool(rows, { ...base, expertise: "Hukuk" })).toEqual([
      awaitingApproval,
    ]);
    expect(
      filterPool(rows, { ...base, capacity: CapacityFilter.Full }),
    ).toEqual([full]);
    expect(filterPool(rows, { ...base, search: "murat" })).toEqual([
      expiringInvite,
    ]);
    expect(expertiseOptions(rows)).toEqual([
      "Büyüme",
      "Hukuk",
      "UX/UI Design",
      "Ürün stratejisi",
    ]);
  });

  it("describes invites and pending checks by their age", () => {
    const now = new Date("2026-09-26T09:00:00Z");
    expect(poolRowNote(expiringInvite, t, now)).toBe(
      "5 gün önce · 2 gün kaldı",
    );
    expect(poolRowNote(expiringInvite, tEn, now)).toBe(
      "5 days ago · 2 days left",
    );
    expect(poolRowNote(awaitingApproval, t, now)).toBe(
      "Uzmanlık doğrulaması · 5 gün",
    );
    expect(poolRowNote(active, t, now)).toBeNull();
    expect(loadShare(active)).toBe(75);
  });

  it("builds the mentor signup link with the invite code", () => {
    expect(mentorInviteLink("abc", "https://menton.com.tr")).toBe(
      "https://menton.com.tr/signup?role=mentor&programInvite=abc",
    );
  });
});

describe("profileMentorId", () => {
  it("opens profiles only where the backend shows them", () => {
    expect(profileMentorId(row())).toBe("mentor-1");
    expect(profileMentorId(row({ status: MentorPoolStatus.Full }))).toBe(
      "mentor-1",
    );
    expect(
      profileMentorId(row({ status: MentorPoolStatus.AwaitingApproval })),
    ).toBe("mentor-1");
    for (const status of [
      MentorPoolStatus.Invited,
      MentorPoolStatus.InviteExpiring,
      MentorPoolStatus.InviteExpired,
    ]) {
      expect(profileMentorId(row({ status }))).toBeNull();
    }
    expect(profileMentorId(row({ mentorId: null }))).toBeNull();
  });
});
