import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StudentAppointmentsView } from "@/components/student/appointments-view";
import {
  AppointmentKind,
  AppointmentSide,
  AppointmentStatus,
} from "@/interfaces/appointment";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import { answerOfficeHoursAlternative } from "@/lib/client/student-office-hours";
import {
  APPOINTMENTS_NOW,
  peerAppointment,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/student-appointments", () => ({
  getStudentAppointments: vi.fn(),
}));
vi.mock("@/lib/client/student-office-hours", () => ({
  answerOfficeHoursAlternative: vi.fn(),
}));

const alternative = peerAppointment({
  id: "alt",
  requestId: null,
  kind: AppointmentKind.OfficeHours,
  category: null,
  status: AppointmentStatus.AlternativeProposed,
  topic: "CV ve yüksek lisans seçenekleri",
  counterpart: {
    userId: "academician-1",
    fullName: "Ahmet Kaya",
    title: "Prof. Dr.",
    department: null,
  },
  startsAt: "2026-11-12T11:00:00.000Z",
  endsAt: "2026-11-12T11:30:00.000Z",
  alternative: {
    startsAt: "2026-11-13T07:30:00.000Z",
    endsAt: "2026-11-13T08:00:00.000Z",
  },
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(APPOINTMENTS_NOW);
  vi.mocked(getStudentAppointments)
    .mockReset()
    .mockResolvedValue(structuredClone([...STUDENT_APPOINTMENTS, alternative]));
});

afterEach(() => {
  vi.useRealTimers();
});

async function panel() {
  return screen.findByRole("tabpanel");
}

describe("StudentAppointmentsView", () => {
  it("lists the confirmed sessions ahead and marks the first for the tour", async () => {
    const { container } = renderWithQueryClient(<StudentAppointmentsView />);

    const list = within(await panel()).getAllByRole("article");
    expect(list).toHaveLength(2);
    expect(
      within(list[0] ?? document.body).getByText("Mert Yılmaz"),
    ).toBeVisible();
    expect(
      container.querySelector('[data-tour="appointments-first-row"]'),
    ).toBe(list[0]);
    expect(screen.getByRole("tab", { name: /Yaklaşan/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("shows the requested and the proposed time of a request", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);
    await userEvent.click(await screen.findByRole("tab", { name: /Talepler/ }));

    const card = within(await panel()).getByRole("article");
    expect(within(card).getByText("Prof. Dr. Ahmet Kaya")).toBeVisible();
    expect(within(card).getByText("Talep ettiğin")).toBeVisible();
    expect(within(card).getByText("Önerilen")).toBeVisible();
    expect(within(card).getByText("Alternatif Önerildi")).toBeVisible();
  });

  it("lets the student accept an Office Hours alternative time", async () => {
    vi.mocked(answerOfficeHoursAlternative).mockResolvedValue({
      ...alternative,
      status: AppointmentStatus.Confirmed,
    });
    renderWithQueryClient(<StudentAppointmentsView />);
    await userEvent.click(await screen.findByRole("tab", { name: /Talepler/ }));
    const card = within(await panel()).getByRole("article");
    expect(within(card).getByRole("button", { name: "Reddet" })).toBeVisible();
    await userEvent.click(
      within(card).getByRole("button", { name: "Önerilen Saati Kabul Et" }),
    );
    expect(answerOfficeHoursAlternative).toHaveBeenCalledWith(
      "alt",
      true,
      alternative.alternative?.startsAt ?? null,
    );
    expect(
      await screen.findByText(
        "Önerilen saati kabul ettin; randevun onaylandı.",
      ),
    ).toBeVisible();
  });

  it("lets the student decline an alternative, which withdraws the request", async () => {
    vi.mocked(answerOfficeHoursAlternative).mockResolvedValue({
      ...alternative,
      status: AppointmentStatus.Withdrawn,
    });
    renderWithQueryClient(<StudentAppointmentsView />);
    await userEvent.click(await screen.findByRole("tab", { name: /Talepler/ }));
    const card = within(await panel()).getByRole("article");
    await userEvent.click(within(card).getByRole("button", { name: "Reddet" }));
    expect(answerOfficeHoursAlternative).toHaveBeenCalledWith(
      "alt",
      false,
      null,
    );
    expect(
      await screen.findByText(
        "Önerilen saati reddettin; talebin geri çekildi.",
      ),
    ).toBeVisible();
  });

  it("shows every offered time with the academician's note and takes the one picked", async () => {
    const times = [
      {
        startsAt: "2026-11-13T07:30:00.000Z",
        endsAt: "2026-11-13T08:00:00.000Z",
      },
      {
        startsAt: "2026-11-16T08:00:00.000Z",
        endsAt: "2026-11-16T08:30:00.000Z",
      },
      {
        startsAt: "2026-11-17T12:00:00.000Z",
        endsAt: "2026-11-17T12:30:00.000Z",
      },
    ];
    vi.mocked(getStudentAppointments).mockResolvedValue([
      {
        ...alternative,
        alternatives: times,
        counterpartMessage: "Perşembe dolu, bunlardan biri olur mu?",
        canAcceptAlternative: true,
        canWithdraw: false,
      },
    ]);
    vi.mocked(answerOfficeHoursAlternative).mockResolvedValue({
      ...alternative,
      status: AppointmentStatus.Confirmed,
    });
    renderWithQueryClient(<StudentAppointmentsView />);
    await userEvent.click(await screen.findByRole("tab", { name: /Talepler/ }));
    const card = within(await panel()).getByRole("article");

    expect(
      within(card).getByText(
        "Akademisyenin mesajı: Perşembe dolu, bunlardan biri olur mu?",
      ),
    ).toBeVisible();
    expect(
      within(card).queryByRole("button", { name: "Reddet" }),
    ).not.toBeInTheDocument();
    const accepts = within(card).getAllByRole("button", {
      name: /önerisini kabul et$/,
    });
    expect(accepts).toHaveLength(3);
    await userEvent.click(accepts[1] ?? document.body);
    expect(answerOfficeHoursAlternative).toHaveBeenCalledWith(
      "alt",
      true,
      times[1]?.startsAt,
    );
  });

  it("gives the reason a cancelled appointment was called off", async () => {
    vi.mocked(getStudentAppointments).mockResolvedValue([
      {
        ...alternative,
        status: AppointmentStatus.Cancelled,
        alternative: null,
        rejectReason: "Fakülte kurulu",
        canAcceptAlternative: false,
      },
    ]);
    renderWithQueryClient(<StudentAppointmentsView />);
    await userEvent.click(await screen.findByRole("tab", { name: /Geçmiş/ }));
    const card = within(await panel()).getByRole("article");
    expect(within(card).getByText("Gerekçe: Fakülte kurulu")).toBeVisible();
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("adds a kind's answer buttons through renderActions", async () => {
    renderWithQueryClient(
      <StudentAppointmentsView
        renderActions={(item) =>
          item.kind === AppointmentKind.OfficeHours ? (
            <button type="button">Ek işlem</button>
          ) : null
        }
      />,
    );
    await userEvent.click(await screen.findByRole("tab", { name: /Talepler/ }));
    expect(
      within(await panel()).getByRole("button", { name: "Ek işlem" }),
    ).toBeVisible();
  });

  it("confirms a request just sent and opens Talepler", async () => {
    const { container } = renderWithQueryClient(
      <StudentAppointmentsView sentTo="Prof. Dr. Ahmet Kaya" />,
    );
    expect(screen.getByText("Randevu talebin gönderildi")).toBeVisible();
    expect(
      screen.getByText(
        "Prof. Dr. Ahmet Kaya yanıtladığında sana bildirim göndereceğiz.",
      ),
    ).toBeVisible();
    expect(
      container.querySelector('[data-tour="appointment-request-sent"]'),
    ).not.toBeNull();
    expect(
      await screen.findByRole("tab", { name: /Talepler/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("narrows everything with the filter and renders the toolbar", async () => {
    renderWithQueryClient(
      <StudentAppointmentsView
        filter={(item) => item.side === AppointmentSide.Mentee}
        toolbar={<p>Rol filtresi</p>}
      />,
    );
    expect(screen.getByText("Rol filtresi")).toBeVisible();
    expect(within(await panel()).getAllByRole("article")).toHaveLength(1);
  });

  it("moves between the tabs with the arrow keys", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);
    const upcoming = await screen.findByRole("tab", { name: /Yaklaşan/ });
    expect(upcoming).toHaveAttribute("tabindex", "0");
    upcoming.focus();
    await userEvent.keyboard("{ArrowRight}");
    const requests = screen.getByRole("tab", { name: /Talepler/ });
    expect(requests).toHaveAttribute("aria-selected", "true");
    expect(requests).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: /Geçmiş/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(upcoming).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{Home}");
    expect(upcoming).toHaveAttribute("aria-selected", "true");
  });

  it("explains the statuses beside the list", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);
    await panel();
    const legend = screen.getByRole("region", {
      name: "Durumlar ne anlama geliyor?",
    });
    expect(
      within(legend).getByText(
        "Yeni saati sen kabul edene kadar randevu onaylanmaz.",
      ),
    ).toBeVisible();
  });

  it("switches to the week and shows the picked session's detail", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);
    await panel();
    await userEvent.click(screen.getByRole("button", { name: "Hafta" }));

    expect(
      screen.getByRole("heading", { name: "9 – 15 Kasım 2026" }),
    ).toBeVisible();
    const detail = screen.getByRole("region", {
      name: "CV ve yüksek lisans seçenekleri",
    });
    expect(within(detail).getByText("Önerilen saat")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: /M\. Yılmaz/ }));
    expect(
      screen.getByRole("region", { name: "Uluslararası Fırsatlar" }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Renkler" })).toBeVisible();
  });

  it("lists every offered time in the picked request's detail", async () => {
    vi.mocked(getStudentAppointments).mockResolvedValue([
      {
        ...alternative,
        alternatives: [
          {
            startsAt: "2026-11-13T07:30:00.000Z",
            endsAt: "2026-11-13T08:00:00.000Z",
          },
          {
            startsAt: "2026-11-16T08:00:00.000Z",
            endsAt: "2026-11-16T08:30:00.000Z",
          },
        ],
      },
    ]);
    renderWithQueryClient(<StudentAppointmentsView />);
    await panel();
    await userEvent.click(screen.getByRole("button", { name: "Hafta" }));

    const detail = screen.getByRole("region", {
      name: "CV ve yüksek lisans seçenekleri",
    });
    expect(within(detail).getByText(/^13 Kas · .* – /)).toBeVisible();
    expect(within(detail).getByText(/^16 Kas · .* – /)).toBeVisible();
    expect(
      within(detail).getAllByRole("button", { name: /önerisini kabul et$/ }),
    ).toHaveLength(2);
  });

  it("pages the calendar and goes back to today", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);
    await panel();
    await userEvent.click(screen.getByRole("button", { name: "Gün" }));
    expect(
      screen.getByRole("heading", { name: "9 Kasım 2026 Pazartesi" }),
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Sonraki" }));
    expect(
      screen.getByRole("heading", { name: "10 Kasım 2026 Salı" }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Bugün" }));
    expect(
      screen.getByRole("heading", { name: "9 Kasım 2026 Pazartesi" }),
    ).toBeVisible();
  });

  it("lists a picked day of the month", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);
    await panel();
    await userEvent.click(screen.getByRole("button", { name: "Ay" }));
    await userEvent.click(
      screen.getByRole("button", { name: "12 Kas, 2 randevu" }),
    );
    const day = screen.getByRole("region", { name: "12 Kas" });
    expect(within(day).getByText(/Zeynep Demir/)).toBeVisible();
    expect(within(day).getByText(/Ahmet Kaya/)).toBeVisible();
  });

  it("offers a way to find a mentor when there are no appointments", async () => {
    vi.mocked(getStudentAppointments).mockResolvedValue([]);
    renderWithQueryClient(<StudentAppointmentsView />);
    expect(await screen.findByText("Henüz randevun yok")).toBeVisible();
    expect(screen.getByRole("link", { name: "Mentor bul" })).toHaveAttribute(
      "href",
      "/student/peer-mentoring",
    );
  });

  it("offers a retry when the list cannot load", async () => {
    vi.mocked(getStudentAppointments).mockRejectedValue(new Error("down"));
    renderWithQueryClient(<StudentAppointmentsView />);
    expect(await screen.findByText("Randevular yüklenemedi.")).toBeVisible();
    vi.mocked(getStudentAppointments).mockResolvedValue([]);
    await userEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(await screen.findByText("Henüz randevun yok")).toBeVisible();
  });
});
