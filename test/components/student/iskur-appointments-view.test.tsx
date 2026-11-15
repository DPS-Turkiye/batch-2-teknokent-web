import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IskurAppointmentsView } from "@/components/student/iskur-appointments-view";
import { PeerMentorGateState } from "@/interfaces/peer-mentoring";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import {
  APPOINTMENTS_NOW,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/student-appointments", () => ({
  getStudentAppointments: vi.fn(),
}));

const gate = { state: PeerMentorGateState.Earned };
vi.mock("@/hooks/use-peer-mentor-give", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-peer-mentor-give")>()),
  usePeerMentorGate: () => ({
    state: gate.state,
    gateAward: null,
    isLoading: false,
    sessionBehind: false,
  }),
}));

beforeEach(() => {
  gate.state = PeerMentorGateState.Earned;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(APPOINTMENTS_NOW);
  vi.mocked(getStudentAppointments)
    .mockReset()
    .mockResolvedValue(structuredClone(STUDENT_APPOINTMENTS));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("IskurAppointmentsView", () => {
  it("marks every appointment with the student's role and filters by it", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<IskurAppointmentsView sentTo={null} />);

    const roles = screen.getByRole("group", { name: "Görüşmelerde rolün" });
    expect(within(roles).getByRole("button", { name: "Tümü" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const panel = await screen.findByRole("tabpanel");
    expect(await within(panel).findByText("Mert Yılmaz")).toBeVisible();
    expect(within(panel).getAllByText("Mentor olarak").length).toBeGreaterThan(
      0,
    );
    expect(within(panel).getAllByText("Mentee olarak").length).toBeGreaterThan(
      0,
    );

    await user.click(
      within(roles).getByRole("button", { name: "Mentee olarak" }),
    );
    await waitFor(() =>
      expect(within(panel).queryByText("Mert Yılmaz")).toBeNull(),
    );

    await user.click(
      within(roles).getByRole("button", { name: "Mentor olarak" }),
    );
    expect(await within(panel).findByText("Mert Yılmaz")).toBeVisible();
    expect(within(panel).queryByText("Zeynep Demir")).toBeNull();
  });

  it.each([PeerMentorGateState.Earned, PeerMentorGateState.Hidden])(
    "keeps the request-sent banner and its tour anchor (%s)",
    async (state) => {
      gate.state = state;
      renderWithQueryClient(
        <IskurAppointmentsView sentTo="Prof. Dr. Ahmet Kaya" />,
      );
      const banner = await screen.findByText("Randevu talebin gönderildi");
      expect(banner).toBeVisible();
      expect(banner.closest("[data-tour]")).toHaveAttribute(
        "data-tour",
        "appointment-request-sent",
      );
    },
  );

  it("shows the plain list without a role filter to a student who only takes mentoring", async () => {
    gate.state = PeerMentorGateState.Hidden;
    renderWithQueryClient(<IskurAppointmentsView sentTo={null} />);

    const panel = await screen.findByRole("tabpanel");
    expect(await within(panel).findByText("Mert Yılmaz")).toBeVisible();
    expect(
      screen.queryByRole("group", { name: "Görüşmelerde rolün" }),
    ).toBeNull();
    expect(within(panel).queryByText("Mentor olarak")).toBeNull();
  });

  it("links a held meeting the student gave to its report, and only that one", async () => {
    vi.setSystemTime(new Date("2026-11-11T11:40:00.000Z"));
    const user = userEvent.setup();
    renderWithQueryClient(<IskurAppointmentsView sentTo={null} />);

    await user.click(await screen.findByRole("tab", { name: /Geçmiş/ }));
    const past = screen.getByRole("tabpanel");
    expect(await within(past).findByText("Mert Yılmaz")).toBeVisible();
    const links = within(past).getAllByRole("link", {
      name: /raporunu doldur/,
    });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName(
      "Mert Yılmaz ile görüşmenin raporunu doldur",
    );
    expect(links[0]).toHaveTextContent("Görüşme raporunu doldur");
    expect(links[0]).toHaveAttribute(
      "href",
      "/student/peer-mentoring/reports/meetings/meeting-2",
    );
  });

  it("offers no report link before the student's meeting starts", async () => {
    renderWithQueryClient(<IskurAppointmentsView sentTo={null} />);

    const panel = await screen.findByRole("tabpanel");
    expect(await within(panel).findByText("Mert Yılmaz")).toBeVisible();
    expect(screen.queryByRole("link", { name: /raporunu doldur/ })).toBeNull();
  });
});
