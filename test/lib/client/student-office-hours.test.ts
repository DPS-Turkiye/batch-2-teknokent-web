import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
} from "@/interfaces/appointment";
import { OfficeHoursRequestStatus } from "@/interfaces/office-hours";
import type {
  OfficeHoursListedAcademician,
  OfficeHoursStudentRequest,
} from "@/interfaces/office-hours-me";
import { ClientApiError } from "@/lib/client/api";
import {
  answerOfficeHoursAlternative as answerAlternative,
  getAcademicianOpenSlots,
  getListedAcademician,
  getListedAcademicians,
  getMyOfficeHoursRequests,
  sendOfficeHoursRequest,
} from "@/lib/client/office-hours-me";
import {
  answerOfficeHoursAlternative,
  getOfficeHoursAcademician,
  getOfficeHoursAcademicians,
  getOfficeHoursSlots,
  getStudentOfficeHoursAppointments,
  requestOfficeHours,
} from "@/lib/client/student-office-hours";

vi.mock("@/lib/client/office-hours-me", () => ({
  answerOfficeHoursAlternative: vi.fn(),
  getAcademicianOpenSlots: vi.fn(),
  getListedAcademician: vi.fn(),
  getListedAcademicians: vi.fn(),
  getMyOfficeHoursRequests: vi.fn(),
  sendOfficeHoursRequest: vi.fn(),
}));

const listed: OfficeHoursListedAcademician = {
  id: "oh-1",
  accountId: "account-1",
  fullName: "Elif Şahin",
  academicTitle: "Doç. Dr.",
  department: "Bilgisayar Mühendisliği",
  faculty: "Mühendislik",
  place: "A-204",
  onlineLink: null,
  contactEmail: null,
  meetingMinutes: 30,
};

function request(
  overrides: Partial<OfficeHoursStudentRequest> = {},
): OfficeHoursStudentRequest {
  return {
    id: "request-1",
    status: OfficeHoursRequestStatus.Pending,
    academician: {
      id: "oh-1",
      fullName: "Elif Şahin",
      academicTitle: "Doç. Dr.",
      department: "Bilgisayar Mühendisliği",
    },
    topic: "Staj",
    description: "CV'ye bakalım",
    courseName: null,
    time: {
      startsAt: "2026-11-24T14:00:00+03:00",
      endsAt: "2026-11-24T14:30:00+03:00",
    },
    proposedTimes: [],
    academicianMessage: null,
    rejectionReason: null,
    place: null,
    onlineLink: null,
    requestedAt: "2026-11-20T10:00:00Z",
    allowedActions: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("student Office Hours client", () => {
  it("shows the listed academicians in the screens' shape, with nothing yet for what has no source", async () => {
    vi.mocked(getListedAcademicians).mockResolvedValue([listed]);

    expect(await getOfficeHoursAcademicians()).toEqual([
      {
        id: "oh-1",
        accountId: "account-1",
        fullName: "Elif Şahin",
        academicTitle: "Doç. Dr.",
        department: "Bilgisayar Mühendisliği",
        faculty: "Mühendislik",
        tags: [],
        about: null,
        topics: [],
        courses: [],
        place: "A-204",
        durationMinutes: 30,
        responseTime: null,
      },
    ]);
  });

  it("answers no academician for one that is not listed, but passes other failures on", async () => {
    vi.mocked(getListedAcademician).mockRejectedValueOnce(
      new ClientApiError("Academician not found.", 404),
    );
    expect(await getOfficeHoursAcademician("oh-9")).toBeNull();

    vi.mocked(getListedAcademician).mockRejectedValueOnce(
      new ClientApiError("Sunucuya ulaşılamadı.", 502),
    );
    await expect(getOfficeHoursAcademician("oh-9")).rejects.toThrow(
      "Sunucuya ulaşılamadı.",
    );
  });

  it("keeps the open slots inside the asked window, each free to ask", async () => {
    vi.mocked(getAcademicianOpenSlots).mockResolvedValue([
      {
        startsAt: "2026-11-23T09:00:00+03:00",
        endsAt: "2026-11-23T09:30:00+03:00",
      },
      {
        startsAt: "2026-11-30T09:00:00+03:00",
        endsAt: "2026-11-30T09:30:00+03:00",
      },
    ]);

    const slots = await getOfficeHoursSlots(
      "oh-1",
      new Date("2026-11-23T00:00:00+03:00"),
      7,
    );

    expect(getAcademicianOpenSlots).toHaveBeenCalledWith("oh-1");
    expect(slots).toEqual([
      {
        startsAt: "2026-11-23T09:00:00+03:00",
        endsAt: "2026-11-23T09:30:00+03:00",
        available: true,
      },
    ]);
  });

  it("sends a request for the picked slot and shows it as a pending Office Hours appointment", async () => {
    vi.mocked(sendOfficeHoursRequest).mockResolvedValue(request());

    const appointment = await requestOfficeHours({
      academicianId: "oh-1",
      slot: {
        startsAt: "2026-11-24T14:00:00+03:00",
        endsAt: "2026-11-24T14:30:00+03:00",
      },
      title: "Staj",
      description: "",
    });

    expect(sendOfficeHoursRequest).toHaveBeenCalledWith({
      academicianId: "oh-1",
      startsAt: "2026-11-24T14:00:00+03:00",
      title: "Staj",
      description: null,
    });
    expect(appointment).toMatchObject({
      id: "request-1",
      kind: AppointmentKind.OfficeHours,
      side: AppointmentSide.Mentee,
      status: AppointmentStatus.Pending,
      topic: "Staj",
      counterpart: { userId: "oh-1", fullName: "Elif Şahin" },
      startsAt: "2026-11-24T14:00:00+03:00",
      alternative: null,
    });
  });

  it.each([
    [OfficeHoursRequestStatus.Pending, AppointmentStatus.Pending],
    [OfficeHoursRequestStatus.MoreInfoRequested, AppointmentStatus.Pending],
    [
      OfficeHoursRequestStatus.CounterProposed,
      AppointmentStatus.AlternativeProposed,
    ],
    [OfficeHoursRequestStatus.Accepted, AppointmentStatus.Confirmed],
    [OfficeHoursRequestStatus.Declined, AppointmentStatus.Rejected],
    [OfficeHoursRequestStatus.Withdrawn, AppointmentStatus.Withdrawn],
  ])("reads %s as %s on Randevularım", async (status, shown) => {
    vi.mocked(getMyOfficeHoursRequests).mockResolvedValue([
      request({ status }),
    ]);

    const [appointment] = await getStudentOfficeHoursAppointments();

    expect(appointment?.status).toBe(shown);
  });

  it("carries the academician's other time, and the place and link once it is a meeting", async () => {
    vi.mocked(getMyOfficeHoursRequests).mockResolvedValue([
      request({
        status: OfficeHoursRequestStatus.CounterProposed,
        proposedTimes: [
          {
            startsAt: "2026-11-25T10:00:00+03:00",
            endsAt: "2026-11-25T10:30:00+03:00",
          },
        ],
      }),
      request({
        id: "request-2",
        status: OfficeHoursRequestStatus.Accepted,
        place: "A-204",
        onlineLink: "https://meet.example.com/x",
      }),
    ]);

    const [offered, booked] = await getStudentOfficeHoursAppointments();

    expect(offered?.alternative).toEqual({
      startsAt: "2026-11-25T10:00:00+03:00",
      endsAt: "2026-11-25T10:30:00+03:00",
    });
    expect(booked).toMatchObject({
      place: "A-204",
      onlineUrl: "https://meet.example.com/x",
    });
  });

  it("shows no requests for an account Office Hours does not know", async () => {
    vi.mocked(getMyOfficeHoursRequests).mockRejectedValue(
      new ClientApiError("Office hours not found.", 404),
    );

    expect(await getStudentOfficeHoursAppointments()).toEqual([]);
  });

  it("takes the offered time, or withdraws when declining", async () => {
    vi.mocked(answerAlternative).mockResolvedValue(
      request({ status: OfficeHoursRequestStatus.Accepted }),
    );

    await answerOfficeHoursAlternative(
      "request-1",
      true,
      "2026-11-25T10:00:00+03:00",
    );
    expect(answerAlternative).toHaveBeenLastCalledWith("request-1", {
      accept: true,
      time: "2026-11-25T10:00:00+03:00",
    });

    await answerOfficeHoursAlternative("request-1", false, null);
    expect(answerAlternative).toHaveBeenLastCalledWith("request-1", {
      accept: false,
    });
  });

  it("never withdraws when asked to accept a time that is not there", async () => {
    await expect(
      answerOfficeHoursAlternative("request-1", true, null),
    ).rejects.toThrow();
    expect(answerAlternative).not.toHaveBeenCalled();
  });
});
