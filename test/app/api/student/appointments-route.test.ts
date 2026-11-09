import { beforeEach, expect, it, vi } from "vitest";

import { GET } from "@/app/api/student/appointments/route";
import { UserRole } from "@/interfaces/session";
import { fetchStudentAppointments } from "@/lib/api/student-appointments";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/student-appointments", () => ({
  fetchStudentAppointments: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchStudentAppointments).mockResolvedValue({
    data: [],
    headers: {},
    status: 200,
  });
});

it("needs a session", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(null);

  expect((await GET()).status).toBe(401);
  expect(fetchStudentAppointments).not.toHaveBeenCalled();
});

it("asks only for the signed-in student's own appointments", async () => {
  vi.mocked(getSessionUser).mockResolvedValue({
    userId: "student-1",
    email: "ayse@odtu-dev.invalid",
    fullName: "Ayşe Yılmaz",
    jobTitle: "",
    role: UserRole.Mentee,
  });

  expect((await GET()).status).toBe(200);
  expect(fetchStudentAppointments).toHaveBeenCalledWith("student-1");
});
