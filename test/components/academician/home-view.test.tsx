import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AcademicianHomeView } from "@/components/academician/home-view";
import type { InstitutionRecord } from "@/interfaces/institution";
import { IdentityKind } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import {
  resetAcademicianSample,
  sampleState,
  saveSampleAvailability,
} from "@/lib/client/fixtures/academician-office-hours-store";
import {
  fetchInstitutionAdvisees,
  fetchInstitutionRecord,
} from "@/lib/client/institution";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));

const RECORD = {
  kinds: [IdentityKind.Academic],
  fullName: "Ayşe Yılmaz",
  email: null,
  faculty: null,
  departmentName: null,
  classYear: null,
  programLevel: null,
  academicTitle: "Doç. Dr.",
  iskurParticipant: false,
  advisor: null,
  syncedAt: null,
} satisfies InstitutionRecord;

// The sample data is placed around "now" when the fixture module loads, so the clock is pinned to a Tuesday
// morning in Istanbul before those imports and in every test; otherwise "today" moves with the hour the suite runs.
const MORNING = vi.hoisted(() => {
  const morning = new Date("2026-11-10T07:00:00Z");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(morning);
  return morning;
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(MORNING);
  resetAcademicianSample();
  vi.mocked(fetchInstitutionRecord).mockReset().mockResolvedValue(RECORD);
  vi.mocked(fetchInstitutionAdvisees)
    .mockReset()
    .mockResolvedValue([
      {
        userId: null,
        fullName: "Ali Çelik",
        departmentName: null,
        classYear: 2,
        programLevel: null,
      },
      {
        // Deniz from the sample requests, so the card shows "Danışanın".
        userId: "sample-student-deniz",
        fullName: "Deniz Kaya",
        departmentName: null,
        classYear: 3,
        programLevel: null,
      },
    ]);
});

afterEach(() => {
  vi.useRealTimers();
});

function statCard(label: string) {
  const card = screen.getByText(label).closest("div");
  if (!card) throw new Error(`No stat card "${label}"`);
  return card;
}

async function requestCard(name: string) {
  return screen.findByRole("region", { name });
}

describe("AcademicianHomeView", () => {
  it("greets by first name and sums up what needs the academician", async () => {
    renderWithQueryClient(<AcademicianHomeView />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Günaydın, Ayşe Hocam",
      }),
    ).toBeVisible();
    expect(statCard("Bekleyen talepler")).toHaveTextContent("2en eskisi dün");
    expect(statCard("Bugünkü randevular")).toHaveTextContent("1ilki 15:30");
    expect(statCard("Bu hafta müsait saat")).toHaveTextContent(
      "4Salı ve Perşembe",
    );
    expect(statCard("Danışan öğrencilerim")).toHaveTextContent("2");
    expect(screen.getByText(/Örnek veriler gösteriliyor/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Müsaitliği Düzenle" }),
    ).toHaveAttribute("href", "/academician/calendar");
    expect(screen.getByRole("link", { name: "Randevularım" })).toHaveAttribute(
      "href",
      "/academician/appointments",
    );
  });

  it("shows the waiting requests, marks an advisee and links to all of them", async () => {
    renderWithQueryClient(<AcademicianHomeView />);

    const deniz = await requestCard("Deniz Kaya");
    expect(within(deniz).getByText("Danışanın")).toBeVisible();
    expect(
      within(deniz).getByText("2. ödevdeki 3. soruda takıldım"),
    ).toBeVisible();
    expect(within(deniz).getByText("Onay Bekliyor")).toBeVisible();
    expect(screen.getByRole("link", { name: /Tümü \(2\)/ })).toHaveAttribute(
      "href",
      "/academician/requests",
    );
    // Ece offered three times, so choosing one happens on the requests page.
    const ece = await requestCard("Ece Aksoy");
    expect(within(ece).queryByText("Danışanın")).not.toBeInTheDocument();
    expect(within(ece).getByRole("link", { name: "Kabul Et" })).toHaveAttribute(
      "href",
      "/academician/requests",
    );
    expect(
      within(ece).getByRole("link", { name: "Alternatif Saat Öner" }),
    ).toHaveAttribute("href", "/academician/requests");
  });

  it("books a request with one time right from its card", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianHomeView />);

    const deniz = await requestCard("Deniz Kaya");
    await user.click(within(deniz).getByRole("button", { name: "Kabul Et" }));

    expect(
      await screen.findByText("Talep kabul edildi, randevu oluşturuldu."),
    ).toBeVisible();
    expect(
      await screen.findByRole("link", { name: /Tümü \(1\)/ }),
    ).toBeVisible();
    expect(
      sampleState().appointments.some(
        (item) => item.id === "sample-appointment-from-sample-request-1",
      ),
    ).toBe(true);
  });

  it("lists today's appointments and the academician's hours", async () => {
    renderWithQueryClient(<AcademicianHomeView />);

    const today = await screen.findByRole("region", { name: "Bugün" });
    expect(today).toHaveTextContent("1 randevu");
    expect(today).toHaveTextContent(
      "15:30Zeynep ArslanBitirme projesi danışmanlığıOnaylandı",
    );
    const availability = screen.getByRole("region", { name: "Müsaitliğim" });
    expect(availability).toHaveTextContent("Salı14:00 – 16:00");
    expect(availability).toHaveTextContent("Perşembe10:00 – 12:00");
    expect(availability).toHaveTextContent("Müsait değilim (Konferans)");
    expect(availability.closest("[data-tour]")).toHaveAttribute(
      "data-tour",
      "availability-weekly",
    );
  });

  it("asks for availability first when the academician has no open hours", async () => {
    const { availability } = sampleState();
    saveSampleAvailability({ ...availability, rules: [], oneOffs: [] });
    renderWithQueryClient(<AcademicianHomeView />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Öğrencilerin senden randevu alabilmesi için müsaitlik ekle",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Randevularım" }),
    ).not.toBeInTheDocument();
    const add = screen.getByRole("link", { name: "Müsaitlik Ekle" });
    expect(add).toHaveAttribute("href", "/academician/calendar");
    expect(add.closest("[data-tour]")).toHaveAttribute(
      "data-tour",
      "availability-add",
    );
    expect(
      within(
        screen.getByRole("list", {
          name: "Ekleyebileceğin müsaitlik türleri",
        }),
      ).getAllByRole("listitem"),
    ).toHaveLength(3);
    expect(statCard("Yaklaşan randevular")).toHaveTextContent("3");
    expect(
      screen.queryByRole("region", { name: "Müsaitliğim" }),
    ).not.toBeInTheDocument();
  });

  it("still lists waiting requests when the hours were cleared", async () => {
    const { availability } = sampleState();
    saveSampleAvailability({ ...availability, rules: [], oneOffs: [] });
    renderWithQueryClient(<AcademicianHomeView />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Öğrencilerin senden randevu alabilmesi için müsaitlik ekle",
      }),
    ).toBeVisible();
    expect(statCard("Bekleyen talepler")).toHaveTextContent("2en eskisi dün");
    expect(await requestCard("Deniz Kaya")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Yanıt bekleyen talepler" }),
    ).toBeVisible();
  });

  it("greets without a name when ODTÜ has no record, and reads in English", async () => {
    // The backend answers 404 when no institution vouches for the caller.
    vi.mocked(fetchInstitutionRecord).mockRejectedValue(
      new ClientApiError("Not found", 404),
    );
    renderWithQueryClient(
      <InLocale locale="en">
        <AcademicianHomeView />
      </InLocale>,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Good morning" }),
    ).toBeVisible();
    expect(screen.getByText("Requests waiting for you")).toBeVisible();
  });
});
