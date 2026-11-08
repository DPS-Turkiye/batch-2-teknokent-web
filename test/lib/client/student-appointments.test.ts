import { expect, it } from "vitest";
import { getStudentAppointments } from "@/lib/client/student-appointments";
it("returns independent fixture data without leaking mutations across reads", async () => {
  const first = await getStudentAppointments();
  first[0].counterpart.fullName = "Changed";
  first.pop();
  const second = await getStudentAppointments();
  expect(second).toHaveLength(4);
  expect(second[0].counterpart.fullName).not.toBe("Changed");
});
