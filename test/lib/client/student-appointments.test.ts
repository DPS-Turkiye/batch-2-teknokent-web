import { beforeEach, expect, it, vi } from "vitest";

import { getStudentAppointments } from "@/lib/client/student-appointments";
import { getStudentHome } from "@/lib/client/student-home";
import { getStudentProfileCompletion } from "@/lib/client/student-profile-completion";
import { httpClient } from "@/lib/http-client";
import { STUDENT_APPOINTMENTS } from "@test/fixtures/student-appointments";

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
