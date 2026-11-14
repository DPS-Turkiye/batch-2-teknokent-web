import { describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import {
  StudyLevel,
  type InstitutionPersonSummary,
} from "@/interfaces/institution";
import {
  adviseeIds,
  adviseeRows,
  filterAdvisees,
  studentProfile,
} from "@/lib/academician-students";
import {
  AdviseeNextKind,
  StudentHistoryBadge,
} from "@/types/academician-office-hours";
import {
  academicianAppointment,
  academicianRequest,
  halfHour,
} from "@test/fixtures/academician-office-hours";

// Tuesday 10 November 2026, 10:00 in Istanbul.
const NOW = new Date("2026-11-10T07:00:00Z");

function person(
  overrides: Partial<InstitutionPersonSummary> = {},
): InstitutionPersonSummary {
  return {
    userId: "student-ayse",
    fullName: "Ayşe Yılmaz",
    departmentName: "Endüstri Mühendisliği",
    classYear: 3,
    programLevel: StudyLevel.Bachelor,
    ...overrides,
  };
}

const AYSE = person();
const BERK = person({
  userId: "student-berk",
  fullName: "Berk Özkan",
  classYear: 4,
});
const CAN = person({ userId: null, fullName: "Can Tekin", classYear: 1 });

const SOURCE = {
  requests: [
    academicianRequest({
      id: "berk-pending",
      requestedTimes: [halfHour("2026-11-17T11:00")],
    }),
    academicianRequest({
      id: "ayse-proposed",
      status: AppointmentStatus.AlternativeProposed,
      student: {
        userId: "student-ayse",
        fullName: "Ayşe Yılmaz",
        title: null,
        department: "Endüstri Mühendisliği",
        classYear: 3,
      },
      topic: "CV ve yüksek lisans seçenekleri",
      proposedTimes: [halfHour("2026-11-13T10:30")],
      allowedActions: [],
    }),
  ],
  appointments: [
    academicianAppointment({
      id: "ayse-past",
      topic: "Ders seçimi ve staj planı",
      ...halfHour("2026-10-28T10:00"),
    }),
    academicianAppointment({
      id: "ayse-today",
      topic: "Dönem başı tanışma",
      ...halfHour("2026-11-10T15:00"),
    }),
    academicianAppointment({
      id: "ayse-cancelled",
      status: AppointmentStatus.Cancelled,
      ...halfHour("2026-11-05T09:00"),
    }),
  ],
};

describe("adviseeIds", () => {
  it("collects the Menton ids and skips advisees who never signed in", () => {
    expect([...adviseeIds([AYSE, CAN])]).toEqual(["student-ayse"]);
  });
});

describe("filterAdvisees", () => {
  it("searches names the Turkish way and sorts them so", () => {
    const people = [
      person({ fullName: "İlkay Işık" }),
      person({ fullName: "Çağrı Ilgaz" }),
      person({ fullName: "Ceren Ak" }),
    ];
    expect(filterAdvisees(people, "").map((p) => p.fullName)).toEqual([
      "Ceren Ak",
      "Çağrı Ilgaz",
      "İlkay Işık",
    ]);
    expect(filterAdvisees(people, "ilk").map((p) => p.fullName)).toEqual([
      "İlkay Işık",
    ]);
    expect(filterAdvisees(people, "IŞIK").map((p) => p.fullName)).toEqual([
      "İlkay Işık",
    ]);
  });
});

describe("adviseeRows", () => {
  const rows = adviseeRows([AYSE, BERK, CAN], SOURCE, NOW);

  it("gives the last meeting and the next booked one", () => {
    expect(rows[0]).toEqual({
      person: AYSE,
      lastAppointmentAt: "2026-10-28T10:00:00+03:00",
      next: {
        kind: AdviseeNextKind.Appointment,
        startsAt: "2026-11-10T15:00:00+03:00",
      },
    });
  });

  it("falls back to a waiting request, and shows nothing for someone unknown to Menton", () => {
    expect(rows[1]?.next).toEqual({
      kind: AdviseeNextKind.PendingRequest,
      startsAt: "2026-11-17T11:00:00+03:00",
    });
    expect(rows[1]?.lastAppointmentAt).toBeNull();
    expect(rows[2]).toEqual({
      person: CAN,
      lastAppointmentAt: null,
      next: null,
    });
  });
});

describe("studentProfile", () => {
  it("takes an advisee's record and lists their meetings with the academician, newest first", () => {
    const profile = studentProfile(
      "student-ayse",
      { advisees: [AYSE], ...SOURCE },
      NOW,
    );
    expect(profile).toMatchObject({
      fullName: "Ayşe Yılmaz",
      department: "Endüstri Mühendisliği",
      classYear: 3,
      programLevel: StudyLevel.Bachelor,
      isAdvisee: true,
      pendingRequest: null,
    });
    expect(profile?.history.map((item) => [item.key, item.badge])).toEqual([
      ["ayse-proposed", StudentHistoryBadge.Proposed],
      ["ayse-today", StudentHistoryBadge.Confirmed],
      ["ayse-cancelled", StudentHistoryBadge.Cancelled],
      ["ayse-past", StudentHistoryBadge.Completed],
    ]);
  });

  it("knows a student who isn't an advisee from their request, with the request waiting", () => {
    const profile = studentProfile(
      "student-berk",
      { advisees: [AYSE], ...SOURCE },
      NOW,
    );
    expect(profile).toMatchObject({
      fullName: "Berk Özkan",
      department: "Endüstri Mühendisliği",
      classYear: 4,
      programLevel: null,
      isAdvisee: false,
    });
    expect(profile?.pendingRequest?.id).toBe("berk-pending");
    expect(profile?.history.map((item) => item.badge)).toEqual([
      StudentHistoryBadge.Pending,
    ]);
  });

  it("knows nothing about a stranger", () => {
    expect(
      studentProfile("student-nobody", { advisees: [AYSE], ...SOURCE }, NOW),
    ).toBeNull();
  });
});
