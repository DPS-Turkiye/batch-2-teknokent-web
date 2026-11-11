import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppointmentKind, AppointmentStatus } from "@/interfaces/appointment";
import { resetStudentOfficeHoursSample } from "@/lib/client/fixtures/student-office-hours-store";
import {
  answerOfficeHoursAlternative,
  getOfficeHoursAcademician,
  getOfficeHoursAcademicians,
  getOfficeHoursSlots,
  getStudentOfficeHoursAppointments,
  requestOfficeHours,
} from "@/lib/client/student-office-hours";

const NOW = new Date(2026, 10, 11, 12);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  resetStudentOfficeHoursSample();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sample Office Hours client", () => {
  it("lists the sample academicians and finds one by id", async () => {
    const all = await getOfficeHoursAcademicians();
    expect(all.length).toBeGreaterThan(0);
    expect(
      (await getOfficeHoursAcademician("sample-academician-kaya"))?.fullName,
    ).toBe("Ahmet Kaya");
    expect(await getOfficeHoursAcademician("nobody")).toBeNull();
  });

  it("gives each academician's weekly slots, none free in the past", async () => {
    const monday = new Date(2026, 10, 9);
    const slots = await getOfficeHoursSlots(
      "sample-academician-kaya",
      monday,
      5,
      30,
    );
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(Date.parse(slot.endsAt) - Date.parse(slot.startsAt)).toBe(
        30 * 60_000,
      );
    }
    expect(
      slots
        .filter((slot) => Date.parse(slot.startsAt) < NOW.getTime())
        .every((slot) => !slot.available),
    ).toBe(true);
    expect(slots.some((slot) => slot.available)).toBe(true);
    expect(
      await getOfficeHoursSlots("sample-academician-er", monday, 5, 30),
    ).toEqual([]);
  });

  it("decides a slot's availability by its own day, whatever window is asked", async () => {
    const monday = new Date(2026, 10, 16);
    const week = await getOfficeHoursSlots(
      "sample-academician-kaya",
      monday,
      5,
      30,
    );
    const fortnight = await getOfficeHoursSlots(
      "sample-academician-kaya",
      new Date(2026, 10, 11),
      14,
      30,
    );
    for (const slot of week) {
      expect(
        fortnight.find((other) => other.startsAt === slot.startsAt)?.available,
      ).toBe(slot.available);
    }
  });

  it("keeps a sent request as a pending Office Hours appointment", async () => {
    const academician = await getOfficeHoursAcademician(
      "sample-academician-kaya",
    );
    expect(academician).not.toBeNull();
    if (!academician) return;
    const slot = {
      startsAt: new Date(2026, 10, 12, 14).toISOString(),
      endsAt: new Date(2026, 10, 12, 14, 30).toISOString(),
    };
    const created = await requestOfficeHours(
      { academicianId: academician.id, slot, title: "CV", description: "Staj" },
      academician,
    );
    expect(created).toMatchObject({
      kind: AppointmentKind.OfficeHours,
      status: AppointmentStatus.Pending,
      topic: "CV",
      ...slot,
    });
    expect(
      (await getStudentOfficeHoursAppointments()).map((item) => item.id),
    ).toContain(created.id);

    const after = await getOfficeHoursSlots(
      academician.id,
      new Date(2026, 10, 9),
      5,
      30,
    );
    expect(
      after.find((item) => item.startsAt === slot.startsAt)?.available,
    ).toBe(false);
    await expect(
      requestOfficeHours(
        {
          academicianId: academician.id,
          slot,
          title: "CV",
          description: "Staj",
        },
        academician,
      ),
    ).rejects.toThrow("Bu saat için zaten bir talebin var.");
  });

  it("confirms the proposed time when accepted and withdraws when declined", async () => {
    const [seeded] = await getStudentOfficeHoursAppointments();
    expect(seeded?.status).toBe(AppointmentStatus.AlternativeProposed);
    if (!seeded?.alternative) return;

    const accepted = await answerOfficeHoursAlternative(seeded.id, true);
    expect(accepted).toMatchObject({
      status: AppointmentStatus.Confirmed,
      startsAt: seeded.alternative.startsAt,
      alternative: null,
    });
    await expect(
      answerOfficeHoursAlternative(seeded.id, false),
    ).rejects.toThrow();

    resetStudentOfficeHoursSample();
    expect((await answerOfficeHoursAlternative(seeded.id, false)).status).toBe(
      AppointmentStatus.Withdrawn,
    );
  });
});
