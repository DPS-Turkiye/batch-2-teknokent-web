import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StudentProfileView } from "@/components/academician/student-profile-view";
import { StudyLevel } from "@/interfaces/institution";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { resetAcademicianSample } from "@/lib/client/fixtures/academician-office-hours-store";
import {
  fetchAdviseeProfile,
  fetchInstitutionAdvisees,
} from "@/lib/client/institution";
import { StudentProfileOrigin } from "@/types/academician-office-hours";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/institution", () => ({
  fetchAdviseeProfile: vi.fn(),
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

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(MORNING);
  resetAcademicianSample();
  vi.mocked(fetchInstitutionAdvisees)
    .mockReset()
    .mockResolvedValue([
      {
        userId: "sample-student-deniz",
        fullName: "Deniz Kaya",
        departmentName: "Bilgisayar Mühendisliği",
        classYear: 3,
        programLevel: StudyLevel.Bachelor,
      },
    ]);
  vi.mocked(fetchAdviseeProfile)
    .mockReset()
    .mockResolvedValue({
      interests: {
        topics: [PeerTopicCategory.CareerInternship],
        subtopics: ["fixture-cv"],
      },
      goal: "Yaz stajı bulmak",
    });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("StudentProfileView", () => {
  it("shows an advisee's record, the waiting request and their meetings", async () => {
    renderWithQueryClient(
      <StudentProfileView
        userId="sample-student-deniz"
        from={StudentProfileOrigin.Advisees}
      />,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Deniz Kaya" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Danışan Öğrencilerim/ }),
    ).toHaveAttribute("href", "/academician/advisees");
    expect(screen.getByText("Danışanın")).toBeVisible();
    expect(screen.getByText("Akademik danışman").nextSibling).toHaveTextContent(
      "Sen",
    );
    // Only their advisor reads the interests and goal; the e-mail stays out until a screen needs it.
    const interests = await screen.findByRole("region", {
      name: "İlgi alanları ve hedefi",
    });
    expect(await within(interests).findByText("Kariyer ve Staj")).toBeVisible();
    expect(within(interests).getByText("Örnek: CV hazırlama")).toBeVisible();
    expect(within(interests).getByText("Yaz stajı bulmak")).toBeVisible();
    expect(fetchAdviseeProfile).toHaveBeenCalledWith("sample-student-deniz");
    expect(screen.queryByText(/E-posta/)).toBeNull();

    const pending = screen.getByRole("region", {
      name: "Yanıt bekleyen talep",
    });
    expect(pending).toHaveTextContent("2. ödevdeki 3. soruda takıldım");
    expect(
      within(pending).getByRole("link", { name: "Alternatif Saat Öner" }),
    ).toHaveAttribute(
      "href",
      "/academician/appointments?request=sample-request-1&step=propose",
    );
    expect(
      within(pending).getByRole("link", { name: "Kabul Et" }),
    ).toHaveAttribute(
      "href",
      "/academician/appointments?request=sample-request-1",
    );

    const history = within(
      screen.getByRole("region", { name: "Seninle randevuları" }),
    ).getAllByRole("listitem");
    expect(history.map((item) => item.textContent)).toEqual([
      expect.stringMatching(/^Final öncesi tekrar.*Onaylandı$/),
      expect.stringMatching(
        /^2\. ödevdeki 3\. soruda takıldım.*Onay Bekliyor$/,
      ),
    ]);
  });

  it("shows a student who is not an advisee without the advisor line", async () => {
    renderWithQueryClient(
      <StudentProfileView
        userId="sample-student-ece"
        from={StudentProfileOrigin.Appointments}
      />,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Ece Aksoy" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Randevularım/ })).toHaveAttribute(
      "href",
      "/academician/appointments",
    );
    expect(screen.queryByText("Danışanın")).toBeNull();
    expect(screen.queryByText("Akademik danışman")).toBeNull();
    expect(screen.getByText("Tamamlandı")).toBeVisible();
    expect(screen.queryByText("İlgi alanları ve hedefi")).toBeNull();
    expect(fetchAdviseeProfile).not.toHaveBeenCalled();
  });

  it("says when an advisee hasn't filled in their interests and goal", async () => {
    vi.mocked(fetchAdviseeProfile).mockResolvedValue({
      interests: { topics: [], subtopics: [] },
      goal: "",
    });
    renderWithQueryClient(
      <StudentProfileView
        userId="sample-student-deniz"
        from={StudentProfileOrigin.Advisees}
      />,
    );

    expect(
      await screen.findByText(
        "Öğrenci henüz ilgi alanlarını ve hedefini doldurmadı.",
      ),
    ).toBeVisible();
  });

  it("shows no interests card when the backend says they aren't the academician's advisee", async () => {
    vi.mocked(fetchAdviseeProfile).mockResolvedValue(null);
    renderWithQueryClient(
      <StudentProfileView
        userId="sample-student-deniz"
        from={StudentProfileOrigin.Advisees}
      />,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Deniz Kaya" }),
    ).toBeVisible();
    expect(fetchAdviseeProfile).toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(screen.queryByText("İlgi alanları ve hedefi")).toBeNull(),
    );
  });

  it("says so for a student the academician has nothing on", async () => {
    renderWithQueryClient(
      <StudentProfileView
        userId="someone-else"
        from={StudentProfileOrigin.Appointments}
      />,
    );
    expect(
      await screen.findByText("Bu öğrenci hakkında gösterilecek bilgi yok."),
    ).toBeVisible();
  });

  it('offers a retry instead of "not found" when the advisee list didn\'t load', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchInstitutionAdvisees)
      .mockReset()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue([
        {
          userId: "advisee-without-meetings",
          fullName: "Mert Yıldız",
          departmentName: "Fizik",
          classYear: 2,
          programLevel: StudyLevel.Bachelor,
        },
      ]);
    renderWithQueryClient(
      <StudentProfileView
        userId="advisee-without-meetings"
        from={StudentProfileOrigin.Advisees}
      />,
    );

    const alert = await screen.findByRole("alert");
    expect(
      screen.queryByText("Bu öğrenci hakkında gösterilecek bilgi yok."),
    ).toBeNull();
    await user.click(
      within(alert).getByRole("button", { name: "Tekrar dene" }),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Mert Yıldız" }),
    ).toBeVisible();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StudentProfileView
          userId="sample-student-deniz"
          from={StudentProfileOrigin.Advisees}
        />
      </InLocale>,
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Deniz Kaya" }),
    ).toBeVisible();
    expect(screen.getByText("Academic advisor").nextSibling).toHaveTextContent(
      "You",
    );
  });
});
