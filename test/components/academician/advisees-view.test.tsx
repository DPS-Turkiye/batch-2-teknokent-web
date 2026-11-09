import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdviseesView } from "@/components/academician/advisees-view";
import {
  StudyLevel,
  type InstitutionPersonSummary,
} from "@/interfaces/institution";
import { fetchInstitutionAdvisees } from "@/lib/client/institution";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionAdvisees: vi.fn(),
  fetchInstitutionRecord: vi.fn(),
}));

const ADVISEES: InstitutionPersonSummary[] = [
  {
    userId: "user-zeynep",
    fullName: "Zeynep Arslan",
    departmentName: "Bilgisayar Mühendisliği",
    classYear: 4,
    programLevel: StudyLevel.Bachelor,
  },
  {
    userId: null,
    fullName: "Ali Çelik",
    departmentName: "Bilgisayar Mühendisliği",
    classYear: null,
    programLevel: StudyLevel.Master,
  },
];

beforeEach(() => {
  vi.mocked(fetchInstitutionAdvisees)
    .mockReset()
    .mockResolvedValue(structuredClone(ADVISEES));
});

describe("AdviseesView", () => {
  it("lists ODTÜ's advisees by name, read-only, and marks who has not signed in", async () => {
    renderWithQueryClient(<AdviseesView />);
    const list = await screen.findByRole("list", {
      name: "Danışan Öğrencilerim",
    });
    const rows = within(list).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Ali Çelik");
    expect(rows[0]).toHaveTextContent("Yüksek lisans");
    expect(rows[0]).toHaveTextContent("Menton'a henüz giriş yapmadı");
    expect(rows[1]).toHaveTextContent("Zeynep Arslan");
    expect(rows[1]).toHaveTextContent(
      "Bilgisayar Mühendisliği · Lisans · 4. sınıf",
    );
    expect(rows[1]).not.toHaveTextContent("giriş yapmadı");
    expect(screen.getByText("2 öğrenci")).toBeVisible();
    expect(within(list).queryByRole("button")).toBeNull();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("searches by name in Turkish and says when nothing matches", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdviseesView />);
    const search = await screen.findByPlaceholderText("Öğrenci ara");
    await user.type(search, "ZEY");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    await user.clear(search);
    await user.type(search, "ÇELİK");
    expect(screen.getByRole("listitem")).toHaveTextContent("Ali Çelik");
    await user.type(search, "x");
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
    expect(screen.queryByPlaceholderText("Öğrenci ara")).toBeNull();
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
      await screen.findByText("Has not signed in to Menton yet"),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "My advisees" })).toBeVisible();
  });
});
