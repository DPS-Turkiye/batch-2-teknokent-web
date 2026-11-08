import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RegularMentorshipDetailPage from "@/app/mentorships/regular/[id]/page";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { UserRole } from "@/interfaces/session";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
const getRegularMentorship = vi.fn();
const updateRegularMentorship = vi.fn();
const deleteRegularMentorship = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "m-1" }),
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({ role: UserRole.Mentor }),
}));

vi.mock("@/lib/client/mentorships", () => ({
  getRegularMentorship: (...args: unknown[]) => getRegularMentorship(...args),
  updateRegularMentorship: (...args: unknown[]) =>
    updateRegularMentorship(...args),
  deleteRegularMentorship: (...args: unknown[]) =>
    deleteRegularMentorship(...args),
  addRegularMentorshipGoal: vi.fn(),
  setRegularMentorshipGoalDone: vi.fn(),
}));

vi.mock("@/lib/client/document-requests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/document-requests")>()),
  listDocumentRequests: vi.fn(async () => []),
}));

function mentorship(
  overrides: Partial<RegularMentorship> = {},
): RegularMentorship {
  return {
    id: "m-1",
    mentorId: "mentor-1",
    mentorName: "Leyla Aksoy",
    organizationId: "org-1",
    organizationName: "Döngü",
    status: "ACTIVE",
    startDate: "2026-09-01",
    endDate: "2026-12-20",
    daysPerWeek: 1,
    goals: null,
    goalItems: [],
    progressPercent: 0,
    ...overrides,
  };
}

describe("RegularMentorshipDetailPage edit/delete", () => {
  beforeEach(() => {
    push.mockReset();
    getRegularMentorship.mockReset();
    updateRegularMentorship.mockReset();
    deleteRegularMentorship.mockReset();
    getRegularMentorship.mockResolvedValue(mentorship());
    updateRegularMentorship.mockResolvedValue(
      mentorship({ daysPerWeek: 2, endDate: "2026-12-31" }),
    );
    deleteRegularMentorship.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("lets the mentor update dates and days per week", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RegularMentorshipDetailPage />);

    await screen.findByRole("heading", { name: "Döngü" });
    await user.click(screen.getByRole("button", { name: "Düzenle" }));

    fireEvent.change(screen.getByLabelText("Haftada gün"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Bitiş"), {
      target: { value: "2026-12-31" },
    });
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(updateRegularMentorship).toHaveBeenCalledWith({
        mentorshipId: "m-1",
        startDate: "2026-09-01",
        endDate: "2026-12-31",
        daysPerWeek: 2,
      });
    });
  });

  it("lets the mentor delete the mentorship", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RegularMentorshipDetailPage />);

    await screen.findByRole("heading", { name: "Döngü" });
    await user.click(screen.getByRole("button", { name: "Sil" }));

    await waitFor(() => {
      expect(deleteRegularMentorship).toHaveBeenCalledWith("m-1");
      expect(push).toHaveBeenCalledWith("/mentorships?tab=regular");
    });
  });
});
