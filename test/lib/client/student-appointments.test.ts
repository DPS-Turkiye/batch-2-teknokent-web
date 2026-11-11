import { beforeEach, expect, it, vi } from "vitest";

import { getStudentAppointments } from "@/lib/client/student-appointments";
import { getStudentHome } from "@/lib/client/student-home";
import { getStudentProfileCompletion } from "@/lib/client/student-profile-completion";
import { httpClient } from "@/lib/http-client";
import {
  APPOINTMENTS_NOW,
  peerAppointment,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";

vi.mock("@/lib/http-client", () => ({ httpClient: { get: vi.fn() } }));
vi.mock("@/lib/client/student-profile-completion", () => ({
  getStudentProfileCompletion: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
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

it("gives Ana Sayfa at most three upcoming sessions, soonest first, and the profile state", async () => {
  vi.mocked(httpClient.get).mockResolvedValue({
    status: 200,
    data: [
      ...STUDENT_APPOINTMENTS,
      peerAppointment({
        id: "meeting-5",
        startsAt: "2026-11-20T08:00:00.000Z",
        endsAt: "2026-11-20T08:30:00.000Z",
      }),
      peerAppointment({
        id: "meeting-6",
        startsAt: "2026-11-21T08:00:00.000Z",
        endsAt: "2026-11-21T08:30:00.000Z",
      }),
    ],
  });

  const home = await getStudentHome(APPOINTMENTS_NOW);

  expect(home.upcomingAppointments.map((item) => item.id)).toEqual([
    "meeting-2",
    "meeting-1",
    "meeting-5",
  ]);
  expect(home.profileCompleted).toBe(false);
});

it("stops asking for the profile once it is finished or skipped", async () => {
  vi.mocked(getStudentProfileCompletion).mockResolvedValue({
    topics: [],
    subtopics: [],
    goal: "",
    completed: false,
    skipped: true,
  });
  expect((await getStudentHome(APPOINTMENTS_NOW)).profileCompleted).toBe(true);
});
