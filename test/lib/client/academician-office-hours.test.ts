import { beforeEach, describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import {
  OfficeHoursAppointmentAction,
  OfficeHoursRequestAction,
} from "@/interfaces/academician-office-hours";
import {
  answerAcademicianRequest,
  cancelAcademicianAppointment,
  getAcademicianAppointments,
  getAcademicianAvailability,
  getAcademicianRequests,
  getOfficeHoursProfileSettings,
  saveAcademicianAvailability,
  saveOfficeHoursProfileSettings,
} from "@/lib/client/academician-office-hours";
import { sampleTime } from "@/lib/client/fixtures/academician-office-hours";
import { resetAcademicianSample } from "@/lib/client/fixtures/academician-office-hours-store";

beforeEach(() => resetAcademicianSample());

describe("academician Office Hours sample source", () => {
  it("hands out copies, so a screen cannot change the sample", async () => {
    const first = await getAcademicianRequests();
    first[0].topic = "değişti";
    expect((await getAcademicianRequests())[0].topic).not.toBe("değişti");
  });

  it("turns an accepted request into a confirmed appointment at the chosen time", async () => {
    const [request] = await getAcademicianRequests();
    const time = request.requestedTimes[0];
    await answerAcademicianRequest(request.id, {
      action: OfficeHoursRequestAction.Accept,
      time,
    });
    expect(
      (await getAcademicianRequests()).map((item) => item.id),
    ).not.toContain(request.id);
    const booked = (await getAcademicianAppointments()).find(
      (item) => item.topic === request.topic,
    );
    expect(booked).toMatchObject({
      status: AppointmentStatus.Confirmed,
      startsAt: time.startsAt,
      allowedActions: [OfficeHoursAppointmentAction.Cancel],
    });
  });

  it("keeps a request open with the offered times, and refuses a second answer", async () => {
    const [request] = await getAcademicianRequests();
    const offered = {
      startsAt: sampleTime(5, 9),
      endsAt: sampleTime(5, 9, 30),
    };
    const updated = await answerAcademicianRequest(request.id, {
      action: OfficeHoursRequestAction.ProposeTimes,
      times: [offered],
      note: null,
    });
    expect(updated).toMatchObject({
      status: AppointmentStatus.AlternativeProposed,
      proposedTimes: [offered],
      allowedActions: [],
    });
    await expect(
      answerAcademicianRequest(request.id, {
        action: OfficeHoursRequestAction.Decline,
        reason: null,
      }),
    ).rejects.toThrow();
  });

  it("asks a question only where the source offers that step", async () => {
    const requests = await getAcademicianRequests();
    const withoutQuestion = requests.find(
      (item) =>
        !item.allowedActions.includes(OfficeHoursRequestAction.AskQuestion),
    )!;
    const withQuestion = requests.find((item) =>
      item.allowedActions.includes(OfficeHoursRequestAction.AskQuestion),
    )!;
    await expect(
      answerAcademicianRequest(withoutQuestion.id, {
        action: OfficeHoursRequestAction.AskQuestion,
        question: "?",
      }),
    ).rejects.toThrow();
    const asked = await answerAcademicianRequest(withQuestion.id, {
      action: OfficeHoursRequestAction.AskQuestion,
      question: "Hangi bölüm?",
    });
    expect(asked?.awaitingStudentReply).toBe(true);
    expect(asked?.messages.at(-1)?.body).toBe("Hangi bölüm?");
  });

  it("cancels only appointments the source can cancel", async () => {
    const appointments = await getAcademicianAppointments();
    const cancellable = appointments.find((item) =>
      item.allowedActions.includes(OfficeHoursAppointmentAction.Cancel),
    )!;
    const fixed = appointments.find(
      (item) =>
        item.status === AppointmentStatus.Confirmed &&
        !item.allowedActions.length,
    )!;
    const cancelled = await cancelAcademicianAppointment(
      cancellable.id,
      "Toplantı",
    );
    expect(cancelled).toMatchObject({
      status: AppointmentStatus.Cancelled,
      rejectReason: "Toplantı",
      allowedActions: [],
    });
    await expect(
      cancelAcademicianAppointment(fixed.id, null),
    ).rejects.toThrow();
  });

  it("saves availability and profile settings for the session", async () => {
    const availability = await getAcademicianAvailability();
    const saved = await saveAcademicianAvailability({
      ...availability,
      rules: availability.rules.slice(0, 1).map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        slotMinutes: rule.slotMinutes,
      })),
      oneOffs: [],
    });
    expect(saved.rules).toHaveLength(1);
    expect(saved.oneOffs).toEqual([]);
    expect(await getAcademicianAvailability()).toEqual(saved);

    await saveOfficeHoursProfileSettings({
      defaultPlace: "B-110",
      onlineLink: null,
      contactEmail: "hoca@metu.edu.tr",
    });
    expect(await getOfficeHoursProfileSettings()).toMatchObject({
      defaultPlace: "B-110",
      contactEmail: "hoca@metu.edu.tr",
    });
  });
});
