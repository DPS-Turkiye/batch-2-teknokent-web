import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdviseesView } from "@/components/academician/advisees-view";
import {
  StudyLevel,
  type InstitutionPersonSummary,
} from "@/interfaces/institution";
import { resetAcademicianSample } from "@/lib/client/fixtures/academician-office-hours-store";
import { fetchInstitutionAdvisees } from "@/lib/client/institution";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionAdvisees: vi.fn(),
  fetchInstitutionRecord: vi.fn(),
}));

// The sample meetings sit around "now" when the fixture module loads: Tuesday 10 November 2026, 10:00 in Istanbul.
const MORNING = vi.hoisted(() => {
  const morning = new Date("2026-11-10T07:00:00Z");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(morning);
  return morning;
});

const ADVISEES: InstitutionPersonSummary[] = [
  {
    userId: "sample-student-zeynep",
    fullName: "Zeynep Arslan",
    departmentName: "Bilgisayar Mühendisliği",
    classYear: 4,
    programLevel: StudyLevel.Bachelor,
  },
  {
    userId: "sample-student-deniz",
    fullName: "Deniz Kaya",
    departmentName: "Bilgisayar Mühendisliği",
    classYear: 3,
    programLevel: StudyLevel.Bachelor,
  },
  {
    userId: null,
    fullName: "Ali Çelik",
    departmentName: "İnşaat Mühendisliği",
    classYear: null,
    programLevel: StudyLevel.Master,
  },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(MORNING);
  resetAcademicianSample();
  vi.mocked(fetchInstitutionAdvisees)
    .mockReset()
    .mockResolvedValue(structuredClone(ADVISEES));
});

afterEach(() => {
  vi.useRealTimers();
});

async function rows() {
  const table = await screen.findByRole("table", {
    name: "Danışan Öğrencilerim · 3 öğrenci",
  });
  // The first row is the header.
  return within(table).getAllByRole("row").slice(1);
}

describe("AdviseesView", () => {
  it("lists ODTÜ's advisees in Turkish order with their meetings", async () => {
    renderWithQueryClient(<AdviseesView />);
    const [ali, deniz, zeynep] = await rows();

    expect(ali).toHaveTextContent("Ali Çelik");
    expect(ali).toHaveTextContent("Menton'a henüz giriş yapmadı");
    expect(within(ali ?? document.body).queryByRole("link")).toBeNull();

    expect(deniz).toHaveTextContent("Bilgisayar Mühendisliği · 3");
    expect(
      within(deniz ?? document.body).getByRole("link", { name: "Deniz Kaya" }),
    ).toHaveAttribute(
      "href",
      "/academician/students/sample-student-deniz?from=advisees",
    );
    expect(
      within(deniz ?? document.body).getByRole("link", {
        name: "Deniz Kaya ile randevular",
      }),
    ).toBeVisible();

    expect(zeynep).toHaveTextContent("Bugün 15:30");
    expect(screen.getByText("Kurumsal kayıttan · salt okunur")).toBeVisible();
    expect(screen.queryByText(/Örnek veriler/)).toBeNull();
  });

  it("searches by name in Turkish and says when nothing matches", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdviseesView />);
    await rows();
    const search = screen.getByRole("searchbox", { name: "Öğrenci ara" });

    await user.type(search, "ZEY");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await user.clear(search);
    await user.type(search, "ÇELİK");
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Ali Çelik");
    await user.type(search, "x");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("Aramana uyan öğrenci yok.")).toBeVisible();
  });

  it("says so when ODTÜ's records show no advisees", async () => {
    vi.mocked(fetchInstitutionAdvisees).mockResolvedValue([]);
    renderWithQueryClient(<AdviseesView />);
    expect(
      await screen.findByText(
        "ODTÜ kayıtlarında danışmanlığında öğrenci görünmüyor.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("offers a retry when loading fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchInstitutionAdvisees).mockRejectedValueOnce(
      new Error("down"),
    );
    renderWithQueryClient(<AdviseesView />);
    const alert = await screen.findByRole("alert");
    await user.click(
      within(alert).getByRole("button", { name: "Tekrar dene" }),
    );
    expect(await screen.findByText("Zeynep Arslan")).toBeVisible();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <AdviseesView />
      </InLocale>,
    );
    expect(
      await screen.findByText("Hasn't signed in to Menton yet"),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "My advisees" })).toBeVisible();
  });
});
