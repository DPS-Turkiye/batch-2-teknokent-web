import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import MentorCalendarPage from "@/app/mentor-dashboard/calendar/page";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function weekGrid() {
  return screen
    .getByRole("heading", { name: "14–18 Eylül 2026" })
    .closest("section") as HTMLElement;
}

function upcomingPanel() {
  return screen
    .getByRole("heading", { name: "Sıradaki görüşmeler" })
    .closest("section") as HTMLElement;
}

async function applyFilter(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(screen.getByRole("button", { name }));
}

describe("MentorCalendarPage", () => {
  it("shows the calendar heading and its weekly summary", () => {
    render(<MentorCalendarPage />);

    expect(screen.getByRole("heading", { name: "Takvim" })).toBeInTheDocument();
    expect(
      screen.getByText("Bu hafta 3 görüşme · 1 program etkinliği · 8 boş slot"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yeni toplantı oluştur" }),
    ).toBeInTheDocument();
  });

  it("renders the working week and its hour rows", () => {
    render(<MentorCalendarPage />);

    const grid = weekGrid();
    expect(within(grid).getByText("Pzt")).toBeInTheDocument();
    expect(within(grid).getByText("Cum")).toBeInTheDocument();
    expect(within(grid).getByText("09:00")).toBeInTheDocument();
    expect(within(grid).getByText("18:00")).toBeInTheDocument();
  });

  it("offers the four calendar filters", () => {
    render(<MentorCalendarPage />);

    for (const name of ["Tümü", "Mentorluk", "Program", "Müsaitlik"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("shows meetings, availability and programme events by default", () => {
    render(<MentorCalendarPage />);

    const grid = weekGrid();
    expect(within(grid).getByText("Döngü · Gülse")).toBeInTheDocument();
    expect(within(grid).getAllByText("Müsait")).toHaveLength(3);
    expect(within(grid).getByText("METU Stars")).toBeInTheDocument();
  });

  it("narrows the grid to mentorship meetings", async () => {
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await applyFilter(user, "Mentorluk");

    const grid = weekGrid();
    expect(within(grid).getByText("Döngü · Gülse")).toBeInTheDocument();
    expect(within(grid).queryAllByText("Müsait")).toHaveLength(0);
    expect(within(grid).queryByText("METU Stars")).not.toBeInTheDocument();
  });

  it("narrows the grid to programme events", async () => {
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await applyFilter(user, "Program");

    const grid = weekGrid();
    expect(within(grid).getByText("METU Stars")).toBeInTheDocument();
    expect(within(grid).queryByText("Döngü · Gülse")).not.toBeInTheDocument();
    expect(within(grid).queryAllByText("Müsait")).toHaveLength(0);
  });

  it("narrows the grid to open availability", async () => {
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await applyFilter(user, "Müsaitlik");

    const grid = weekGrid();
    expect(within(grid).getAllByText("Müsait")).toHaveLength(3);
    expect(within(grid).queryByText("Döngü · Gülse")).not.toBeInTheDocument();
    expect(within(grid).queryByText("METU Stars")).not.toBeInTheDocument();
  });

  it("restores every event when Tümü is reselected", async () => {
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await applyFilter(user, "Program");
    await applyFilter(user, "Tümü");

    const grid = weekGrid();
    expect(within(grid).getByText("Döngü · Gülse")).toBeInTheDocument();
    expect(within(grid).getAllByText("Müsait")).toHaveLength(3);
    expect(within(grid).getByText("METU Stars")).toBeInTheDocument();
  });

  it("opens the meeting detail from a booked slot", async () => {
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(
      within(weekGrid()).getByRole("button", { name: /Döngü · Gülse/ }),
    );

    const dialog = screen.getByRole("dialog", { name: "UX Research Review" });
    expect(within(dialog).getByText("Döngü · Gülse Buran")).toBeInTheDocument();
    expect(
      within(dialog).getByText("14 Eylül · 14:00 · 45 dk"),
    ).toBeInTheDocument();
  });

  it("keeps availability blocks non-interactive", async () => {
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(
      within(weekGrid()).getAllByRole("button", { name: /Müsait/ })[0],
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the meeting detail again", async () => {
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(
      within(weekGrid()).getByRole("button", { name: /Döngü · Gülse/ }),
    );
    await user.click(screen.getByRole("button", { name: "Kapat" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists the next meetings with their slots", () => {
    render(<MentorCalendarPage />);

    const panel = upcomingPanel();
    expect(within(panel).getAllByRole("button")).toHaveLength(3);
    expect(within(panel).getByText("UX Research Review")).toBeInTheDocument();
    expect(within(panel).getByText("Pzt 14 · 14:00")).toBeInTheDocument();
  });

  // The detail modal is still presentation-only: every meeting opens the same
  // sample record until the calendar is connected to the meetings API.
  it("opens the meeting detail from the next-meetings list", async () => {
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(
      within(upcomingPanel()).getByRole("button", {
        name: /Design System kickoff/,
      }),
    );

    expect(
      screen.getByRole("dialog", { name: "UX Research Review" }),
    ).toBeInTheDocument();
  });

  it("summarises recurring availability", () => {
    render(<MentorCalendarPage />);

    expect(
      screen.getByRole("heading", { name: "Müsaitliğim" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tekrarlayan haftalık uygunluk"),
    ).toBeInTheDocument();
  });
});
