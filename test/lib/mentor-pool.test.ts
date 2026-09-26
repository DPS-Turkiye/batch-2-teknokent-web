import { describe, expect, it } from "vitest";

import { type MentorPoolRow, MentorPoolStatus } from "@/interfaces/mentor-pool";
import {
  CapacityFilter,
  expertiseOptions,
  filterPool,
  loadShare,
  mentorInviteLink,
  PoolFilter,
  poolFilterOptions,
  poolRowNote,
} from "@/lib/mentor-pool";

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

const rows = [
  row(),
  row({
    mentorId: "mentor-2",
    fullName: "Kerem Sarı",
    status: MentorPoolStatus.Full,
    expertise: ["Büyüme"],
  }),
  row({
    mentorId: "mentor-3",
    fullName: "Zeynep Arslan",
    status: MentorPoolStatus.AwaitingApproval,
    expertise: ["Hukuk"],
  }),
  row({
    mentorId: null,
    inviteId: "invite-1",
    fullName: null,
    email: "murat.koc@mail.com",
    status: MentorPoolStatus.InviteExpiring,
    expertise: [],
    inviteCode: "abc",
    since: "2026-09-20T10:00:00Z",
    expiresAt: "2026-09-27T10:00:00Z",
  }),
];

describe("mentor pool helpers", () => {
  it("counts each filter and narrows by status, expertise, capacity and search", () => {
    expect(poolFilterOptions(rows).map((option) => option.label)).toEqual([
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
      rows[3],
    ]);
    expect(filterPool(rows, { ...base, expertise: "Hukuk" })).toEqual([
      rows[2],
    ]);
    expect(
      filterPool(rows, { ...base, capacity: CapacityFilter.Full }),
    ).toEqual([rows[1]]);
    expect(filterPool(rows, { ...base, search: "murat" })).toEqual([rows[3]]);
    expect(expertiseOptions(rows)).toEqual([
      "Büyüme",
      "Hukuk",
      "UX/UI Design",
      "Ürün stratejisi",
    ]);
  });

  it("describes invites and pending checks by their age", () => {
    const now = new Date("2026-09-26T09:00:00Z");
    expect(poolRowNote(rows[3], now)).toBe("5 gün önce · 2 gün kaldı");
    expect(poolRowNote(rows[2], now)).toBe("Uzmanlık doğrulaması · 5 gün");
    expect(poolRowNote(rows[0], now)).toBeNull();
    expect(loadShare(rows[0])).toBe(75);
  });

  it("builds the mentor signup link with the invite code", () => {
    expect(mentorInviteLink("abc", "https://menton.com.tr")).toBe(
      "https://menton.com.tr/signup?role=mentor&programInvite=abc",
    );
  });
});
