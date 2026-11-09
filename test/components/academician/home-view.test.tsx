import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AcademicianHomeView } from "@/components/academician/home-view";
import type { InstitutionRecord } from "@/interfaces/institution";
import { IdentityKind } from "@/interfaces/session";
import {
  fetchInstitutionAdvisees,
  fetchInstitutionRecord,
} from "@/lib/client/institution";
import { resetAcademicianSample } from "@/lib/client/fixtures/academician-office-hours-store";
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

// The sample appointments are placed around "now" when the fixture module loads, so the clock is pinned to a fixed
// Istanbul morning before those imports and in every test; otherwise the "today" slots turn into past ones late in
// the day and the tests fail depending on the hour.
const MORNING = vi.hoisted(() => {
  const morning = new Date("2026-11-10T07:00:00Z");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(morning);
  return morning;
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(MORNING);
});

afterEach(() => {
  vi.useRealTimers();
});

beforeEach(() => {
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
        userId: "u",
        fullName: "Zeynep Arslan",
        departmentName: null,
        classYear: 4,
        programLevel: null,
      },
    ]);
});

describe("AcademicianHomeView", () => {
  it("greets by title and name and counts what needs the academician", async () => {
    renderWithQueryClient(<AcademicianHomeView />);
    expect(
      await screen.findByRole("heading", {
        name: "Merhaba, Doç. Dr. Ayşe Yılmaz",
      }),
    ).toBeVisible();
    const pending = (await screen.findByText("Yanıt bekleyen talep")).closest(
      "div",
    )!.parentElement as HTMLElement;
    expect(pending).toHaveTextContent("2");
    expect(
      within(pending).getByRole("link", { name: /Taleplere git/ }),
    ).toHaveAttribute("href", "/academician/requests");
    const advisees = (await screen.findByText("Danışan öğrenci")).closest(
      "div",
    )!.parentElement as HTMLElement;
    expect(advisees).toHaveTextContent("2");
    expect(screen.getByRole("note")).toHaveTextContent("Örnek veriler");
  });

  it("previews the next appointments and the latest requests with links to their pages", async () => {
    renderWithQueryClient(<AcademicianHomeView />);
    const next = await screen.findByRole("list", {
      name: "Sıradaki randevular",
    });
    expect(within(next).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(next).getByText("Bitirme projesi danışmanlığı"),
    ).toBeVisible();
    const latest = screen.getByRole("list", { name: "Son talepler" });
    expect(within(latest).getAllByRole("listitem")).toHaveLength(2);
    expect(within(latest).getAllByText("Onay Bekliyor").length).toBe(2);
    expect(
      screen.getByRole("link", { name: "Ofis saatlerini düzenle" }),
    ).toHaveAttribute("href", "/academician/calendar");
  });

  it("falls back to a plain greeting without an ODTÜ record, and reads in English", async () => {
    vi.mocked(fetchInstitutionRecord).mockResolvedValue(
      null as unknown as InstitutionRecord,
    );
    renderWithQueryClient(
      <InLocale locale="en">
        <AcademicianHomeView />
      </InLocale>,
    );
    expect(await screen.findByRole("heading", { name: "Hello" })).toBeVisible();
    expect(await screen.findByText("Requests waiting for you")).toBeVisible();
  });
});
