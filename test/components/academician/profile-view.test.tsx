import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcademicianProfileView } from "@/components/academician/profile-view";
import type { InstitutionRecord } from "@/interfaces/institution";
import { IdentityKind } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import { fetchInstitutionRecord } from "@/lib/client/institution";
import {
  getOfficeHoursProfileSettings,
  saveOfficeHoursProfileSettings,
} from "@/lib/client/academician-office-hours";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/institution", () => ({
  fetchInstitutionRecord: vi.fn(),
  fetchInstitutionAdvisees: vi.fn(),
}));
vi.mock("@/lib/client/academician-office-hours", () => ({
  getOfficeHoursProfileSettings: vi.fn(),
  saveOfficeHoursProfileSettings: vi.fn(),
}));

const RECORD: InstitutionRecord = {
  kinds: [IdentityKind.Academic],
  fullName: "Ayşe Yılmaz",
  email: "ayse@metu.edu.tr",
  faculty: "Mühendislik Fakültesi",
  departmentName: "Bilgisayar Mühendisliği",
  classYear: null,
  programLevel: null,
  academicTitle: "Doç. Dr.",
  iskurParticipant: false,
  advisor: null,
  syncedAt: "2026-11-08T09:00:00Z",
};

beforeEach(() => {
  vi.mocked(fetchInstitutionRecord).mockReset().mockResolvedValue(RECORD);
  vi.mocked(getOfficeHoursProfileSettings).mockReset().mockResolvedValue({
    defaultPlace: "A-204",
    onlineLink: null,
    contactEmail: null,
  });
  vi.mocked(saveOfficeHoursProfileSettings)
    .mockReset()
    .mockImplementation(async (settings) => settings);
});

describe("AcademicianProfileView", () => {
  it("shows ODTÜ's record read-only and the Office Hours details as sample data", async () => {
    renderWithQueryClient(<AcademicianProfileView />);
    const card = await screen.findByRole("region", {
      name: "Kurumsal Bilgiler",
    });
    expect(card).toHaveTextContent("Ayşe Yılmaz");
    expect(card).toHaveTextContent("Doç. Dr.");
    expect(card).toHaveTextContent("Bilgisayar Mühendisliği");
    expect(card).toHaveTextContent("ODTÜ'den, salt okunur");
    expect(within(card).queryByRole("textbox")).toBeNull();
    const settings = screen.getByRole("region", {
      name: "Ofis saati bilgileri",
    });
    expect(within(settings).getByRole("note")).toHaveTextContent(
      "Örnek veriler",
    );
    expect(await within(settings).findByDisplayValue("A-204")).toBeVisible();
    expect(
      within(settings).getByRole("button", { name: "Kaydet" }),
    ).toBeDisabled();
  });

  it("refuses a link that is not a web address and a bad e-mail, then saves", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianProfileView />);
    const link = await screen.findByLabelText(
      "Çevrim içi görüşme bağlantısı (isteğe bağlı)",
    );
    await user.type(link, "javascript:alert(1)");
    await user.type(
      screen.getByLabelText("Öğrencilere gösterilecek e-posta (isteğe bağlı)"),
      "ayse@",
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(
      screen.getByText("Bağlantı https:// ile başlayan bir web adresi olmalı."),
    ).toBeVisible();
    expect(screen.getByText("Geçerli bir e-posta adresi yaz.")).toBeVisible();
    expect(saveOfficeHoursProfileSettings).not.toHaveBeenCalled();

    await user.clear(link);
    await user.type(link, "https://meet.example.org/ayse");
    await user.type(
      screen.getByLabelText("Öğrencilere gösterilecek e-posta (isteğe bağlı)"),
      "metu.edu.tr",
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(saveOfficeHoursProfileSettings).toHaveBeenCalledWith({
      defaultPlace: "A-204",
      onlineLink: "https://meet.example.org/ayse",
      contactEmail: "ayse@metu.edu.tr",
    });
    expect(
      await screen.findByText("Profil bilgilerin kaydedildi."),
    ).toBeVisible();
  });

  it("treats a 404 as no ODTÜ record, not an error, and reads in English", async () => {
    vi.mocked(fetchInstitutionRecord).mockRejectedValue(
      new ClientApiError("Not found", 404),
    );
    renderWithQueryClient(
      <InLocale locale="en">
        <AcademicianProfileView />
      </InLocale>,
    );
    expect(
      await screen.findByText("There is no ODTÜ record for this account."),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "My profile" })).toBeVisible();
  });
});
