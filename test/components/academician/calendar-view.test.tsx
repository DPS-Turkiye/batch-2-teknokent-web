import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AcademicianCalendarView } from "@/components/academician/calendar-view";
import { getAcademicianAvailability } from "@/lib/client/academician-office-hours";
import { sampleTime } from "@/lib/client/fixtures/academician-office-hours";
import { resetAcademicianSample } from "@/lib/client/fixtures/academician-office-hours-store";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

beforeEach(() => resetAcademicianSample());

describe("AcademicianCalendarView", () => {
  it("edits weekly hours in the shared editor with only the slot length as a number", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianCalendarView />);
    expect(
      await screen.findByLabelText("Salı 1. aralık başlangıç"),
    ).toHaveValue("14:00");
    expect(screen.getByText("Varsayılan görüşme süresi")).toBeVisible();
    expect(screen.queryByText("Eş zamanlı mentorluk limiti")).toBeNull();
    expect(screen.queryByText("İki görüşme arası tampon")).toBeNull();
    expect(screen.getByText("UYGUN OLMADIĞIN TARİHLER")).toBeVisible();
    expect(screen.getByRole("note")).toHaveTextContent("Örnek veriler");

    fireEvent.change(screen.getByLabelText("Salı 1. aralık bitiş"), {
      target: { value: "17:00" },
    });
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(
      await screen.findByText("Müsaitlik ayarların kaydedildi."),
    ).toBeVisible();
    const saved = await getAcademicianAvailability();
    expect(
      saved.rules.find((rule) => rule.startTime === "14:00")?.endTime,
    ).toBe("17:00");
    expect(saved.oneOffs).toHaveLength(1);
  });

  it("lists, checks, adds and removes one-off hours", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianCalendarView />);
    const list = await screen.findByRole("list", {
      name: "Tek seferlik saatler",
    });
    expect(within(list).getByText("B-110")).toBeVisible();

    const form = screen.getByRole("form", { name: "Tek seferlik saatler" });
    await user.click(within(form).getByRole("button", { name: "Ekle" }));
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Tarih, başlangıç ve bitiş saatini seç.",
    );
    const day = sampleTime(8, 0).slice(0, 10);
    fireEvent.change(within(form).getByLabelText("Tarih"), {
      target: { value: day },
    });
    fireEvent.change(within(form).getByLabelText("Başlangıç"), {
      target: { value: "15:00" },
    });
    fireEvent.change(within(form).getByLabelText("Bitiş"), {
      target: { value: "14:00" },
    });
    await user.click(within(form).getByRole("button", { name: "Ekle" }));
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Bitiş saati başlangıçtan sonra olmalı.",
    );
    fireEvent.change(within(form).getByLabelText("Bitiş"), {
      target: { value: "16:30" },
    });
    await user.type(within(form).getByLabelText("Yer (isteğe bağlı)"), "Lab 3");
    await user.click(within(form).getByRole("button", { name: "Ekle" }));
    expect(
      await screen.findByText("Tek seferlik saatler kaydedildi."),
    ).toBeVisible();
    expect(await within(list).findByText("Lab 3")).toBeVisible();
    expect((await getAcademicianAvailability()).oneOffs).toHaveLength(2);

    const removeB110 = within(list)
      .getAllByRole("button")
      .find((button) => button.closest("li")?.textContent?.includes("B-110"))!;
    await user.click(removeB110);
    await screen.findAllByText("Tek seferlik saatler kaydedildi.");
    expect(await within(list).findByText("Lab 3")).toBeVisible();
    expect(within(list).queryByText("B-110")).toBeNull();
  });

  it("refuses one-off hours on a day off and names it", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianCalendarView />);
    const form = await screen.findByRole("form", {
      name: "Tek seferlik saatler",
    });
    fireEvent.change(within(form).getByLabelText("Tarih"), {
      target: { value: sampleTime(11, 0).slice(0, 10) },
    });
    fireEvent.change(within(form).getByLabelText("Başlangıç"), {
      target: { value: "10:00" },
    });
    fireEvent.change(within(form).getByLabelText("Bitiş"), {
      target: { value: "11:00" },
    });
    await user.click(within(form).getByRole("button", { name: "Ekle" }));
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Bu tarih uygun olmadığın tarihler arasında (Konferans).",
    );
    expect((await getAcademicianAvailability()).oneOffs).toHaveLength(1);
  });

  it("refuses one-off hours in the past", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AcademicianCalendarView />);
    const form = await screen.findByRole("form", {
      name: "Tek seferlik saatler",
    });
    fireEvent.change(within(form).getByLabelText("Tarih"), {
      target: { value: sampleTime(-1, 0).slice(0, 10) },
    });
    fireEvent.change(within(form).getByLabelText("Başlangıç"), {
      target: { value: "10:00" },
    });
    fireEvent.change(within(form).getByLabelText("Bitiş"), {
      target: { value: "11:00" },
    });
    await user.click(within(form).getByRole("button", { name: "Ekle" }));
    expect(within(form).getByRole("alert")).toHaveTextContent(
      "Geçmiş bir zamana saat eklenemez.",
    );
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <AcademicianCalendarView />
      </InLocale>,
    );
    expect(
      await screen.findByRole("heading", { name: "Calendar" }),
    ).toBeVisible();
    expect(await screen.findByText("Weekly office hours")).toBeVisible();
  });
});
