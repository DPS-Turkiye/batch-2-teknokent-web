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
});
