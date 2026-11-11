import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AcademicianRequestsView } from "@/components/academician/requests-view";
import { resetAcademicianSample } from "@/lib/client/fixtures/academician-office-hours-store";
import { itemAt } from "@test/fixtures/list-assertions";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

beforeEach(() => resetAcademicianSample());

async function card(topic: string) {
  const heading = await screen.findByRole("heading", { name: topic });
  return heading.closest("li") as HTMLElement;
}

describe("AcademicianRequestsView", () => {
  it("splits requests by whose answer they wait for and offers only the source's answers", async () => {
    renderWithQueryClient(<AcademicianRequestsView />);
    const mine = await screen.findByRole("list", {
      name: "Yanıtını bekleyenler",
    });
    expect(within(mine).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    const theirs = screen.getByRole("list", {
      name: "Öğrencinin yanıtı bekleniyor",
    });
    expect(within(theirs).getAllByRole("heading", { level: 3 })).toHaveLength(
      2,
    );
    expect(
      within(theirs).getByText("Soru sordun, öğrencinin cevabı bekleniyor."),
    ).toBeVisible();
    expect(within(theirs).getByText("Önerdiğin saatler")).toBeVisible();
    expect(screen.getByText(/Örnek veriler/)).toBeVisible();

    const single = await card("2. ödevdeki 3. soruda takıldım");
    expect(
      within(single).getByRole("button", { name: "Kabul Et" }),
    ).toBeVisible();
    expect(
      within(single).queryByRole("button", { name: "Soru Sor" }),
    ).toBeNull();
    const course = await card("Dönem projesi için konu seçimi");
    expect(within(course).getByText("İstenen saatler")).toBeVisible();
    expect(within(course).getByText(/CENG 101/)).toBeVisible();
    expect(
      within(course).getByRole("button", { name: "Soru Sor" }),
    ).toBeVisible();
    // A request with times offered waits for the student: nothing to press.
    const offered = await card("Staj başvurusu için referans");
    expect(within(offered).queryByRole("button")).toBeNull();
  });

  it("accepts a single-time request at once and drops it from the list", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianRequestsView />);
    const request = await card("2. ödevdeki 3. soruda takıldım");
    await user.click(within(request).getByRole("button", { name: "Kabul Et" }));
    await user.click(within(request).getByRole("button", { name: "Kabul Et" }));
    expect(
      await screen.findByText("Talep kabul edildi, randevu oluşturuldu."),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "2. ödevdeki 3. soruda takıldım" }),
    ).toBeNull();
  });

  it("asks which time when the student offered several", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianRequestsView />);
    const request = await card("Dönem projesi için konu seçimi");
    await user.click(within(request).getByRole("button", { name: "Kabul Et" }));
    const form = within(request).getByRole("form", { name: "Kabul Et" });
    await user.click(within(form).getByRole("button", { name: "Kabul Et" }));
    expect(within(form).getByRole("alert")).toHaveTextContent("Bir saat seç.");
    await user.click(itemAt(within(form).getAllByRole("radio"), 1));
    await user.click(within(form).getByRole("button", { name: "Kabul Et" }));
    expect(
      await screen.findByText("Talep kabul edildi, randevu oluşturuldu."),
    ).toBeVisible();
  });

  it("sends up to three other times and moves the request to the student's side", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianRequestsView />);
    const request = await card("2. ödevdeki 3. soruda takıldım");
    await user.click(
      within(request).getByRole("button", { name: "Alternatif Saat Öner" }),
    );
    const form = within(request).getByRole("form", {
      name: "Alternatif Saat Öner",
    });
    await user.click(within(form).getByRole("button", { name: "Gönder" }));
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "En az bir saat seç.",
    );
    await user.click(within(form).getByRole("button", { name: "Saat ekle" }));
    await user.click(within(form).getByRole("button", { name: "Saat ekle" }));
    expect(
      within(form).queryByRole("button", { name: "Saat ekle" }),
    ).toBeNull();
    fireEvent.change(within(form).getByLabelText("1. saat"), {
      target: { value: "2026-10-01T10:00" },
    });
    await user.click(within(form).getByRole("button", { name: "Gönder" }));
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Geçmiş bir saat önerilemez.",
    );
    fireEvent.change(within(form).getByLabelText("1. saat"), {
      target: { value: "2099-12-01T10:00" },
    });
    await user.click(within(form).getByRole("button", { name: "Gönder" }));
    expect(
      await screen.findByText("Önerdiğin saatler öğrenciye gönderildi."),
    ).toBeVisible();
    const theirs = screen.getByRole("list", {
      name: "Öğrencinin yanıtı bekleniyor",
    });
    expect(
      within(theirs).getByRole("heading", {
        name: "2. ödevdeki 3. soruda takıldım",
      }),
    ).toBeVisible();
    expect(within(theirs).getByText(/1 Aralık 2099/)).toBeVisible();
  });

  it("declines with an optional reason and asks a question where the source allows", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianRequestsView />);
    const first = await card("2. ödevdeki 3. soruda takıldım");
    await user.click(within(first).getByRole("button", { name: "Reddet" }));
    await user.type(
      within(first).getByLabelText("Neden (isteğe bağlı)"),
      "Bu hafta dolu",
    );
    await user.click(within(first).getByRole("button", { name: "Gönder" }));
    expect(await screen.findByText("Talep reddedildi.")).toBeVisible();

    const course = await card("Dönem projesi için konu seçimi");
    await user.click(within(course).getByRole("button", { name: "Soru Sor" }));
    await user.click(within(course).getByRole("button", { name: "Gönder" }));
    expect(within(course).getByRole("alert")).toHaveTextContent("Sorunu yaz.");
    await user.type(
      within(course).getByLabelText("Öğrenciye sorun"),
      "Hangi konular?",
    );
    await user.click(within(course).getByRole("button", { name: "Gönder" }));
    expect(
      await screen.findByText("Sorun öğrenciye gönderildi."),
    ).toBeVisible();
    expect(
      screen.queryByRole("list", { name: "Yanıtını bekleyenler" }),
    ).toBeNull();
    expect(screen.getByText("Yanıt bekleyen talep yok.")).toBeVisible();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <AcademicianRequestsView />
      </InLocale>,
    );
    expect(
      await screen.findByRole("heading", { name: "Appointment requests" }),
    ).toBeVisible();
    expect(
      (await screen.findAllByRole("button", { name: "Propose another time" }))
        .length,
    ).toBeGreaterThan(0);
  });
});
