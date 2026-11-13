import { describe, expect, it } from "vitest";

import { AppointmentKind, AppointmentStatus } from "@/interfaces/appointment";
import type { StudentOfficeHoursSlot } from "@/interfaces/student-office-hours";
import { OFFICE_HOURS_ACADEMICIANS_SAMPLE } from "@/lib/client/fixtures/student-office-hours";
import {
  academicianName,
  ADVISOR_ACADEMICIAN_ID,
  advisorAcademician,
  canAnswerAlternative,
  filterAcademicians,
  firstBookableWeekDay,
  freeSlots,
  offeredTimes,
  officeHoursRequestErrors,
  officeHoursWeek,
  optionsOf,
  type OfficeHoursFilter,
} from "@/lib/student-office-hours";
import { peerAppointment } from "@test/fixtures/student-appointments";
import { STUDENT_RECORD } from "@test/fixtures/student-home";

const ALL: OfficeHoursFilter = {
  query: "",
  faculty: null,
  department: null,
  availableOnly: false,
};

function slot(
  day: number,
  hour: number,
  available = true,
): StudentOfficeHoursSlot {
  return {
    startsAt: new Date(2026, 10, day, hour).toISOString(),
    endsAt: new Date(2026, 10, day, hour, 30).toISOString(),
    available,
  };
}

describe("academicianName", () => {
  it("puts the title before the name", () => {
    expect(
      academicianName({ academicTitle: "Prof. Dr.", fullName: "Ahmet Kaya" }),
    ).toBe("Prof. Dr. Ahmet Kaya");
    expect(
      academicianName({ academicTitle: null, fullName: "Ahmet Kaya" }),
    ).toBe("Ahmet Kaya");
  });
});

describe("advisorAcademician", () => {
  it("makes an Office Hours entry of the record's advisor", () => {
    expect(advisorAcademician(STUDENT_RECORD)).toMatchObject({
      id: ADVISOR_ACADEMICIAN_ID,
      fullName: "Elif Şahin",
      academicTitle: "Doç. Dr.",
      department: "Endüstri Mühendisliği",
    });
  });

  it("has none without an advisor", () => {
    expect(advisorAcademician({ ...STUDENT_RECORD, advisor: null })).toBeNull();
  });
});

describe("filterAcademicians", () => {
  const none = () => false;

  it("finds by name with Turkish case rules", () => {
    expect(
      filterAcademicians(
        OFFICE_HOURS_ACADEMICIANS_SAMPLE,
        { ...ALL, query: "ÖZTÜRK" },
        none,
      ).map((item) => item.fullName),
    ).toEqual(["Can Öztürk"]);
  });

  it("narrows by faculty and department", () => {
    const engineering = filterAcademicians(
      OFFICE_HOURS_ACADEMICIANS_SAMPLE,
      { ...ALL, faculty: "Mühendislik Fakültesi" },
      none,
    );
    expect(engineering).toHaveLength(2);
    expect(
      filterAcademicians(
        OFFICE_HOURS_ACADEMICIANS_SAMPLE,
        { ...ALL, department: "Fizik" },
        none,
      ).map((item) => item.fullName),
    ).toEqual(["Murat Koç"]);
  });

  it("keeps only those with a free slot when asked", () => {
    expect(
      filterAcademicians(
        OFFICE_HOURS_ACADEMICIANS_SAMPLE,
        { ...ALL, availableOnly: true },
        (id) => id === "sample-academician-kaya",
      ).map((item) => item.id),
    ).toEqual(["sample-academician-kaya"]);
  });
});

describe("optionsOf", () => {
  it("lists each faculty once, in Turkish order", () => {
    expect(optionsOf(OFFICE_HOURS_ACADEMICIANS_SAMPLE, "faculty")).toEqual([
      "Fen Fakültesi",
      "İktisadi ve İdari Bilimler Fakültesi",
      "Mimarlık Fakültesi",
      "Mühendislik Fakültesi",
    ]);
  });
});

describe("freeSlots", () => {
  it("keeps the free slots, earliest first", () => {
    expect(
      freeSlots([slot(12, 14), slot(10, 9, false), slot(11, 10)]).map(
        (item) => item.startsAt,
      ),
    ).toEqual([slot(11, 10).startsAt, slot(12, 14).startsAt]);
  });
});

describe("officeHoursWeek", () => {
  it("lays the slots out Monday to Friday with their free counts", () => {
    const week = officeHoursWeek(
      [slot(12, 14), slot(12, 10, false), slot(10, 10)],
      new Date(2026, 10, 12),
    );
    expect(week.map((column) => column.day.getDate())).toEqual([
      9, 10, 11, 12, 13,
    ]);
    expect(week.map((column) => column.freeCount)).toEqual([0, 1, 0, 1, 0]);
    expect(week[3]?.slots.map((item) => item.available)).toEqual([false, true]);
  });
});

describe("officeHoursRequestErrors", () => {
  it("asks for both the title and the description", () => {
    expect(officeHoursRequestErrors(" ", "Açıklama")).toEqual({
      title: true,
      description: false,
    });
    expect(officeHoursRequestErrors("Başlık", "")).toEqual({
      title: false,
      description: true,
    });
    expect(officeHoursRequestErrors("Başlık", "Açıklama")).toBeNull();
  });
});

describe("canAnswerAlternative", () => {
  it("is only for an Office Hours request with another time proposed", () => {
    const officeHours = peerAppointment({
      kind: AppointmentKind.OfficeHours,
      status: AppointmentStatus.AlternativeProposed,
    });
    expect(canAnswerAlternative(officeHours)).toBe(true);
    expect(
      canAnswerAlternative({
        ...officeHours,
        status: AppointmentStatus.Pending,
      }),
    ).toBe(false);
    expect(
      canAnswerAlternative({
        ...officeHours,
        kind: AppointmentKind.PeerMentoring,
      }),
    ).toBe(false);
  });

  it("goes by what the backend allows once it says", () => {
    const officeHours = peerAppointment({
      kind: AppointmentKind.OfficeHours,
      status: AppointmentStatus.AlternativeProposed,
    });
    expect(
      canAnswerAlternative({ ...officeHours, canAcceptAlternative: false }),
    ).toBe(false);
    expect(
      canAnswerAlternative({
        ...officeHours,
        status: AppointmentStatus.Pending,
        canAcceptAlternative: true,
      }),
    ).toBe(true);
  });
});

describe("offeredTimes", () => {
  const first = {
    startsAt: "2026-11-25T10:00:00+03:00",
    endsAt: "2026-11-25T10:30:00+03:00",
  };
  const second = {
    startsAt: "2026-11-26T11:00:00+03:00",
    endsAt: "2026-11-26T11:30:00+03:00",
  };

  it("lists every offered time, or the one the sample data carries", () => {
    expect(
      offeredTimes(
        peerAppointment({ alternative: first, alternatives: [first, second] }),
      ),
    ).toEqual([first, second]);
    expect(offeredTimes(peerAppointment({ alternative: first }))).toEqual([
      first,
    ]);
    expect(offeredTimes(peerAppointment({ alternative: null }))).toEqual([]);
  });
});

describe("firstBookableWeekDay", () => {
  it("opens on today during the week and on the coming Monday at the weekend", () => {
    expect(firstBookableWeekDay(new Date(2026, 10, 12, 15))).toEqual(
      new Date(2026, 10, 12),
    );
    expect(firstBookableWeekDay(new Date(2026, 10, 14, 9))).toEqual(
      new Date(2026, 10, 16),
    );
    expect(firstBookableWeekDay(new Date(2026, 10, 15, 9))).toEqual(
      new Date(2026, 10, 16),
    );
  });
});
