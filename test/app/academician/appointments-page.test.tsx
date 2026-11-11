import { describe, expect, it, vi } from "vitest";

import AcademicianAppointmentsPage from "@/app/academician/appointments/page";
import { AcademicianAppointmentsView } from "@/components/academician/appointments-view";

vi.mock("@/components/academician/appointments-view", () => ({
  AcademicianAppointmentsView: vi.fn(() => null),
}));

describe("academician appointments page", () => {
  it("renders Randevularım, which reads its state from the URL itself", () => {
    expect(AcademicianAppointmentsPage().type).toBe(
      AcademicianAppointmentsView,
    );
  });
});
