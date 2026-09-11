import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegularMentorshipsTab } from "@/components/mentorships/regular-mentorships-tab";
import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { UserRole } from "@/interfaces/session";
import { renderWithQueryClient } from "@test/test-utils";

const getRegularMentorships = vi.fn();
const searchOrganizations = vi.fn();
const startRegularMentorship = vi.fn();

vi.mock("@/lib/client/mentorships", () => ({
  getRegularMentorships: (...args: unknown[]) => getRegularMentorships(...args),
  searchOrganizations: (...args: unknown[]) => searchOrganizations(...args),
  startRegularMentorship: (...args: unknown[]) =>
    startRegularMentorship(...args),
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
    goalItems: [
      { id: "g-1", title: "PMF", done: true, sortOrder: 0 },
      { id: "g-2", title: "GTM", done: false, sortOrder: 1 },
    ],
    progressPercent: 50,
    ...overrides,
  };
}

describe("RegularMentorshipsTab", () => {
  beforeEach(() => {
    getRegularMentorships.mockReset();
    searchOrganizations.mockReset();
    startRegularMentorship.mockReset();
    getRegularMentorships.mockResolvedValue([mentorship()]);
    searchOrganizations.mockResolvedValue([
      { id: "org-2", name: "Nova Labs" },
      { id: "org-3", name: "Orbit AI" },
    ]);
  });

  it("lists regular mentorships with progress", async () => {
    renderWithQueryClient(
      <RegularMentorshipsTab role={UserRole.Mentor} canStart />,
    );

    expect(
      await screen.findByRole("heading", { name: "Düzenli mentorlükler" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Döngü")).toBeInTheDocument();
    expect(screen.getByText("%50")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Düzenli mentorlük başlat" }),
    ).toBeInTheDocument();
  });

  it("filters startups in the start dialog", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <RegularMentorshipsTab role={UserRole.Mentor} canStart />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Düzenli mentorlük başlat" }),
    );
    const dialog = await screen.findByRole("dialog");
    const search = within(dialog).getByPlaceholderText("Startup adı...");
    await user.type(search, "Orbit");
    expect(within(dialog).getByText("Orbit AI")).toBeInTheDocument();
    expect(within(dialog).queryByText("Nova Labs")).not.toBeInTheDocument();
  });
});
