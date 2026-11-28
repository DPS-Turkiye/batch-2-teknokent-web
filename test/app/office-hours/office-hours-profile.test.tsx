import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficeHoursProfileScreen } from "@/components/office-hours/office-hours-profile-screen";
import { ClientApiError } from "@/lib/client/api";
import { getOfficeHoursAvailability } from "@/lib/client/office-hours";
import { officeHoursSession } from "@/lib/client/office-hours-session";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/office-hours", () => ({
  getOfficeHoursAvailability: vi.fn(),
}));
vi.mock("@/lib/client/office-hours-session", () => ({
  officeHoursSession: vi.fn(),
}));
vi.mock("@/components/office-hours/academic-profile-view", () => ({
  AcademicProfileView: ({ fullName }: { fullName: string }) => (
    <p>profile of {fullName}</p>
  ),
}));
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

function renderProfile() {
  return renderWithQueryClient(
    <InLocale locale="tr">
      <OfficeHoursProfileScreen />
    </InLocale>,
  );
}

describe("office-hours profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(officeHoursSession).mockResolvedValue({
      userId: "user-1",
      fullName: "Ali Kaya",
    });
  });

  it("shows an academic their profile", async () => {
    vi.mocked(getOfficeHoursAvailability).mockResolvedValue({
      rules: [],
      exceptions: [],
      menteeCapacity: null,
      defaultMeetingDurationMinutes: 45,
      meetingBufferMinutes: 15,
    });

    renderProfile();

    expect(await screen.findByText("profile of Ali Kaya")).toBeInTheDocument();
  });

  // Students have no office hours of their own; the backend says who is an academic.
  it("sends a student, whom the backend refuses, to the no-role explanation", async () => {
    vi.mocked(getOfficeHoursAvailability).mockRejectedValue(
      new ClientApiError("no", 403),
    );

    renderProfile();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/office-hours/launch-error?reason=no-role",
      ),
    );
  });

  it("sends someone without an office-hours session to the expired explanation", async () => {
    vi.mocked(officeHoursSession).mockRejectedValue(
      new ClientApiError("gone", 401),
    );

    renderProfile();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/office-hours/launch-error?reason=expired",
      ),
    );
    expect(getOfficeHoursAvailability).not.toHaveBeenCalled();
  });
});
