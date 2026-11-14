import { describe, expect, it, vi } from "vitest";

import AcademicianStudentPage from "@/app/academician/students/[userId]/page";
import { StudentProfileView } from "@/components/academician/student-profile-view";
import { StudentProfileOrigin } from "@/types/academician-office-hours";

vi.mock("@/components/academician/student-profile-view", () => ({
  StudentProfileView: vi.fn(() => null),
}));

async function render(userId: string, from?: string | string[]) {
  return AcademicianStudentPage({
    params: Promise.resolve({ userId }),
    searchParams: Promise.resolve(from === undefined ? {} : { from }),
  });
}

describe("academician student page", () => {
  it("passes the decoded id and where the back link goes", async () => {
    const page = await render("user%2042", StudentProfileOrigin.Advisees);
    expect(page.type).toBe(StudentProfileView);
    expect(page.props).toEqual({
      userId: "user 42",
      from: StudentProfileOrigin.Advisees,
    });
  });

  it.each([undefined, "elsewhere", ["advisees", "advisees"]])(
    "goes back to Randevularım for from=%s",
    async (from) => {
      const page = await render("user-1", from);
      expect(page.props).toMatchObject({
        from: StudentProfileOrigin.Appointments,
      });
    },
  );
});
