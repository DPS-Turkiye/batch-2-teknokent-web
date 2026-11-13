import { beforeEach, expect, it, vi } from "vitest";

import { AppointmentKind } from "@/interfaces/appointment";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import { getStudentHome } from "@/lib/client/student-home";
import { getStudentOfficeHoursAppointments } from "@/lib/client/student-office-hours";
import { getStudentProfileCompletion } from "@/lib/client/student-profile-completion";
import { httpClient } from "@/lib/http-client";
import {
  peerAppointment,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";

vi.mock("@/lib/http-client", () => ({ httpClient: { get: vi.fn() } }));
vi.mock("@/lib/client/student-office-hours", () => ({
  getStudentOfficeHoursAppointments: vi.fn(),
}));
vi.mock("@/lib/client/student-profile-completion", () => ({
  getStudentProfileCompletion: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getStudentOfficeHoursAppointments).mockResolvedValue([]);
  vi.mocked(httpClient.get).mockResolvedValue({
    status: 200,
    data: STUDENT_APPOINTMENTS,
  });
  vi.mocked(getStudentProfileCompletion).mockResolvedValue({
    topics: [],
    subtopics: [],
    goal: "",
    completed: false,
    skipped: false,
  });
});

it("reads the student's appointments from the app's own API", async () => {
  expect(await getStudentAppointments()).toEqual(STUDENT_APPOINTMENTS);
  expect(httpClient.get).toHaveBeenCalledWith("/api/student/appointments");
});

it("adds the Office Hours requests after the peer sessions", async () => {
  const officeHours = peerAppointment({
    id: "office-hours-1",
    kind: AppointmentKind.OfficeHours,
  });
  vi.mocked(getStudentOfficeHoursAppointments).mockResolvedValue([officeHours]);
  expect(await getStudentAppointments()).toEqual([
    ...STUDENT_APPOINTMENTS,
    officeHours,
  ]);
});

it("gives Ana Sayfa every appointment and the profile state", async () => {
  const home = await getStudentHome();

  expect(home).toEqual({
    profileCompleted: false,
    appointments: STUDENT_APPOINTMENTS,
  });
});

it("stops asking for the profile once it is finished or skipped", async () => {
  vi.mocked(getStudentProfileCompletion).mockResolvedValue({
    topics: [],
    subtopics: [],
    goal: "",
    completed: false,
    skipped: true,
  });
  expect((await getStudentHome()).profileCompleted).toBe(true);
});
