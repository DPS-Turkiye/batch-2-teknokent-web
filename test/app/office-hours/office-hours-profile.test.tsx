import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OfficeHoursProfilePage from "@/app/office-hours/profile/page";
import { fetchOfficeHoursAvailability } from "@/lib/api/lti";
import { getOfficeHoursUser } from "@/lib/server/office-hours-session";

vi.mock("@/lib/api/lti", () => ({ fetchOfficeHoursAvailability: vi.fn() }));
vi.mock("@/lib/server/office-hours-session", () => ({
  getOfficeHoursUser: vi.fn(),
}));
vi.mock("@/components/office-hours/academic-profile-view", () => ({
  AcademicProfileView: ({ fullName }: { fullName: string }) => (
    <p>profile of {fullName}</p>
  ),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("REDIRECT:" + path);
  },
}));

describe("office-hours profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOfficeHoursUser).mockResolvedValue({
      userId: "user-1",
      fullName: "Ali Kaya",
    });
  });

  it("opens an academic's own page", async () => {
    vi.mocked(fetchOfficeHoursAvailability).mockResolvedValue({
      status: 200,
      headers: {},
      data: {} as never,
    });

    render(await OfficeHoursProfilePage());

    expect(fetchOfficeHoursAvailability).toHaveBeenCalledWith("user-1");
    expect(screen.getByText("profile of Ali Kaya")).toBeInTheDocument();
  });

  it("sends a student to the explanation, since only academics have office hours", async () => {
    vi.mocked(fetchOfficeHoursAvailability).mockResolvedValue({
      status: 403,
      headers: {},
      data: {} as never,
    });

    await expect(OfficeHoursProfilePage()).rejects.toThrow(
      "REDIRECT:/office-hours/launch-error?reason=no-role",
    );
  });

  it("needs an office-hours session", async () => {
    vi.mocked(getOfficeHoursUser).mockResolvedValue(null);

    await expect(OfficeHoursProfilePage()).rejects.toThrow(
      "REDIRECT:/office-hours/launch-error?reason=expired",
    );
    expect(fetchOfficeHoursAvailability).not.toHaveBeenCalled();
  });
});
