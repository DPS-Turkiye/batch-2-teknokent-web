import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StudentOfficeHoursView } from "@/components/student/office-hours-view";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import { STUDENT_RECORD } from "@test/fixtures/student-home";
import { listAdvisorAs } from "@test/fixtures/student-office-hours-client";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock(
  "@/lib/client/student-office-hours",
  async () => await import("@test/fixtures/student-office-hours-client"),
);
vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 9, 8));
  vi.mocked(fetchInstitutionRecord)
    .mockReset()
    .mockResolvedValue(STUDENT_RECORD);
});

afterEach(() => {
  vi.useRealTimers();
  listAdvisorAs(null);
});

async function cards() {
  return screen.findAllByRole("article");
}

describe("StudentOfficeHoursView", () => {
  it("puts the advisor on top, marked for the tour, with no times until they list their office hours", async () => {
    const { container } = renderWithQueryClient(<StudentOfficeHoursView />);
    const advisor = await screen.findByRole("region", {
      name: "Doç. Dr. Elif Şahin",
    });
    expect(within(advisor).getByText("Akademik danışmanın")).toBeVisible();
    expect(
      container.querySelector('[data-tour="office-hours-academician"]'),
    ).toBe(advisor);
    expect(
      await within(advisor).findByText(
        "Danışmanının şu anda müsait saati yok.",
      ),
    ).toBeVisible();
  });

  it("shows a listed advisor's own times and booking, and does not repeat them in the list", async () => {
    listAdvisorAs("academician-1");
    renderWithQueryClient(<StudentOfficeHoursView />);
    const advisor = await screen.findByRole("region", {
      name: "Prof. Dr. Ahmet Kaya",
    });

    expect(within(advisor).getByText("Akademik danışmanın")).toBeVisible();
    expect(
      within(advisor).getByRole("link", { name: "Randevu Talep Et" }),
    ).toHaveAttribute(
      "href",
      "/student/office-hours/sample-academician-kaya/book",
    );
    expect(await within(advisor).findAllByRole("listitem")).not.toHaveLength(0);
    expect(
      (await cards()).filter((card) =>
        within(card).queryByRole("heading", { name: "Prof. Dr. Ahmet Kaya" }),
      ),
    ).toHaveLength(0);
  });

  it("lists the academicians with a free time and counts everyone", async () => {
    renderWithQueryClient(<StudentOfficeHoursView />);
    const shown = await cards();
    expect(screen.getByText("6 akademisyen")).toBeVisible();
    expect(
      within(shown[0] ?? document.body).getByRole("heading", {
        name: "Prof. Dr. Ahmet Kaya",
      }),
    ).toBeVisible();
    expect(
      within(shown[0] ?? document.body).getByRole("link", {
        name: "Müsait Saatleri Gör",
      }),
    ).toHaveAttribute(
      "href",
      "/student/office-hours/sample-academician-kaya/book",
    );
    expect(
      screen.queryByRole("heading", { name: "Dr. Öğr. Üyesi Deniz Er" }),
    ).toBeNull();
  });

  it("shows academicians without a free time once the toggle is off", async () => {
    renderWithQueryClient(<StudentOfficeHoursView />);
    await cards();
    await userEvent.click(
      screen.getByRole("button", { name: "Müsait saati olanlar" }),
    );
    const deniz = await screen.findByRole("heading", {
      name: "Dr. Öğr. Üyesi Deniz Er",
    });
    const card = deniz.closest("article");
    expect(card).not.toBeNull();
    expect(
      within(card ?? document.body).getByText("Şu anda müsait saat yok"),
    ).toBeVisible();
    expect(
      within(card ?? document.body).getByRole("link", { name: "Profili Gör" }),
    ).toHaveAttribute("href", "/student/office-hours/sample-academician-er");
  });

  it("searches by name and filters by faculty", async () => {
    renderWithQueryClient(<StudentOfficeHoursView />);
    await cards();
    await userEvent.click(
      screen.getByRole("button", { name: "Müsait saati olanlar" }),
    );

    await userEvent.type(screen.getByRole("searchbox"), "arslan");
    expect(await cards()).toHaveLength(1);
    await userEvent.clear(screen.getByRole("searchbox"));

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Fakülte" }),
      "Fen Fakültesi",
    );
    expect(await cards()).toHaveLength(2);
  });

  it("marks the first card for the tour when there is no advisor", async () => {
    vi.mocked(fetchInstitutionRecord).mockResolvedValue({
      ...STUDENT_RECORD,
      advisor: null,
    });
    const { container } = renderWithQueryClient(<StudentOfficeHoursView />);
    const [first] = await cards();
    expect(
      container.querySelector('[data-tour="office-hours-academician"]'),
    ).toBe(first);
  });
});
