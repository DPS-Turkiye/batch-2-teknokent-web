import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StudentAppointmentsView } from "@/components/student/appointments-view";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import {
  APPOINTMENTS_NOW,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/student-appointments", () => ({
  getStudentAppointments: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(APPOINTMENTS_NOW);
  vi.mocked(getStudentAppointments)
    .mockReset()
    .mockResolvedValue(structuredClone(STUDENT_APPOINTMENTS));
});

afterEach(() => {
  vi.useRealTimers();
});

function section(name: string) {
  return screen.getByRole("list", { name });
}

describe("StudentAppointmentsView", () => {
  it("shows upcoming sessions soonest first, then the past, with side, status and the counterpart", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);

    const upcoming = await screen.findByRole("list", { name: "Yaklaşan" });
    const rows = within(upcoming).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Uluslararası Fırsatlar")).toBeVisible();
    expect(within(rows[0]).getByText("Mentor olarak")).toBeVisible();
    expect(within(rows[0]).getByText(/Mert Yılmaz · Fizik/)).toBeVisible();
    expect(within(rows[1]).getByText("Mentee olarak")).toBeVisible();
    expect(within(rows[1]).getByText("Onaylandı")).toBeVisible();
    expect(
      within(rows[1]).getByText("Staj başvurusu için CV'me bakar mısın?"),
    ).toBeVisible();

    const past = within(section("Geçmiş")).getAllByRole("listitem");
    expect(past).toHaveLength(2);
    expect(within(past[0]).getByText("İptal Edildi")).toBeVisible();
  });

  it("offers a join link only on a confirmed online session still ahead", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);

    const join = await screen.findByRole("link", { name: "Görüşmeye katıl" });
    expect(join).toHaveAttribute(
      "href",
      "https://meet.google.com/abc-defg-hij",
    );
    expect(join).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(section("Geçmiş")).queryByRole("link")).toBeNull();
  });

  it("filters by the statuses the student has and comes back to all", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StudentAppointmentsView />);
    const filter = await screen.findByRole("group", {
      name: "Duruma göre süz",
    });
    expect(
      within(filter)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Tümü", "Onaylandı", "İptal Edildi"]);

    await user.click(
      within(filter).getByRole("button", { name: "İptal Edildi" }),
    );
    expect(screen.getByText("Yaklaşan randevun yok.")).toBeVisible();
    expect(within(section("Geçmiş")).getAllByRole("listitem")).toHaveLength(1);

    await user.click(within(filter).getByRole("button", { name: "Tümü" }));
    expect(within(section("Yaklaşan")).getAllByRole("listitem")).toHaveLength(
      2,
    );
  });

  it("points a student with no appointments to the peer mentors, without a false empty state while loading", async () => {
    vi.mocked(getStudentAppointments).mockReturnValueOnce(
      new Promise(() => {}),
    );
    const { unmount } = renderWithQueryClient(<StudentAppointmentsView />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Randevular yükleniyor",
    );
    expect(screen.queryByText("Henüz randevun yok.")).toBeNull();
    unmount();

    vi.mocked(getStudentAppointments).mockResolvedValue([]);
    renderWithQueryClient(<StudentAppointmentsView />);
    expect(await screen.findByText("Henüz randevun yok.")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Akran mentoru bul" }),
    ).toHaveAttribute("href", "/student/peer-mentoring");
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("recovers from a failed load through retry", async () => {
    vi.mocked(getStudentAppointments).mockRejectedValueOnce(new Error("down"));
    const user = userEvent.setup();
    renderWithQueryClient(<StudentAppointmentsView />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Randevular yüklenemedi.",
    );
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(await screen.findByRole("list", { name: "Yaklaşan" })).toBeVisible();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StudentAppointmentsView />
      </InLocale>,
    );

    expect(await screen.findByRole("list", { name: "Upcoming" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "My appointments" }),
    ).toBeVisible();
    expect(screen.getByText("As mentor")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Join the session" }),
    ).toBeVisible();
  });
});
