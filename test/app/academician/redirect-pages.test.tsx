import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import AcademicianCalendarPage from "@/app/academician/calendar/page";
import AcademicianRequestsPage from "@/app/academician/requests/page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("old academician pages", () => {
  it("sends Talepler to Randevularım with requests selected", () => {
    AcademicianRequestsPage();
    expect(redirect).toHaveBeenCalledWith(
      "/academician/appointments?filter=requests",
    );
  });

  it("sends Takvim to the availability page", () => {
    AcademicianCalendarPage();
    expect(redirect).toHaveBeenCalledWith(
      "/academician/appointments/availability",
    );
  });
});
