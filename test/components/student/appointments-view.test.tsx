import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentAppointmentsView } from "@/components/student/appointments-view";
import { getStudentAppointments } from "@/lib/client/student-appointments";
import { STUDENT_APPOINTMENTS_FIXTURE } from "@/lib/client/fixtures/student-appointments";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/student-appointments", () => ({
  getStudentAppointments: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(getStudentAppointments)
    .mockReset()
    .mockResolvedValue(structuredClone(STUDENT_APPOINTMENTS_FIXTURE));
});

describe("StudentAppointmentsView and query hook", () => {
  it("unifies mentor, mentee and Office Hours rows, earliest first, with unconfirmed alternative times", async () => {
    renderWithQueryClient(<StudentAppointmentsView />);
    const list = await screen.findByRole("list", { name: "Randevularım" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent("Kariyer planı");
    expect(within(list).getByText("Mentor olarak")).toBeVisible();
    expect(within(list).getByText("Office Hours")).toBeVisible();
    expect(within(list).getByText("Yer: IE 204")).toBeVisible();
    expect(
      within(list).getByText(/Önerilen alternatif \(henüz onaylanmadı\)/),
    ).toBeVisible();
    expect(within(list).queryByRole("button")).toBeNull();
    expect(screen.getByText(/Örnek veriler gösteriliyor/)).toBeVisible();
  });
  it("filters by status, distinguishes no matches, and restores all rows", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StudentAppointmentsView />);
    await screen.findByRole("list");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Durum" }),
      "PENDING",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Office Hours")).toBeVisible();
    await user.selectOptions(screen.getByRole("combobox"), "EXPIRED");
    expect(screen.getByText("Bu durumda randevun yok.")).toBeVisible();
    await user.selectOptions(screen.getByRole("combobox"), "");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
  it("shows loading without a false empty state", () => {
    vi.mocked(getStudentAppointments).mockReturnValue(new Promise(() => {}));
    renderWithQueryClient(<StudentAppointmentsView />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Randevular yükleniyor",
    );
    expect(screen.queryByText("Henüz randevun yok.")).toBeNull();
  });
  it("shows the truly empty state", async () => {
    vi.mocked(getStudentAppointments).mockResolvedValue([]);
    renderWithQueryClient(<StudentAppointmentsView />);
    expect(await screen.findByText("Henüz randevun yok.")).toBeVisible();
  });
  it("recovers from a client failure through retry", async () => {
    vi.mocked(getStudentAppointments).mockRejectedValueOnce(
      new Error("failure"),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<StudentAppointmentsView />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Randevular yüklenemedi.",
    );
    await user.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(await screen.findByRole("list")).toBeVisible();
  });
  it("renders English labels and preserves status semantics", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StudentAppointmentsView />
      </InLocale>,
    );
    await screen.findByRole("list", { name: "My appointments" });
    expect(screen.getByRole("combobox", { name: "Status" })).toBeVisible();
    expect(screen.getByText("As mentor")).toBeVisible();
    expect(
      within(screen.getByRole("list")).getByText("Awaiting approval"),
    ).toBeVisible();
  });
});
