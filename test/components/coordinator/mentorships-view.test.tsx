import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinatorMentorshipsView } from "@/components/coordinator/mentorships-view";
import { CoordinatorMentorshipHealth } from "@/interfaces/coordinator-mentorship";
import {
  getCoordinatorMentorship,
  getCoordinatorMentorships,
  remindCoordinatorMentorship,
} from "@/lib/client/coordinator-mentorships";
import { getCoordinatorPrograms } from "@/lib/client/coordinator-programs";
import {
  coordinatorMentorship,
  coordinatorMentorshipDetail,
} from "@test/fixtures/coordinator-mentorships";
import { coordinatorProgram } from "@test/fixtures/coordinator-programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-mentorships", () => ({
  getCoordinatorMentorships: vi.fn(),
  getCoordinatorMentorship: vi.fn(),
  remindCoordinatorMentorship: vi.fn(),
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorPrograms: vi.fn(),
}));

const lumen = coordinatorMentorship();
const kavun = coordinatorMentorship({
  id: "mentorship-2",
  organizationName: "Kavun",
  health: CoordinatorMentorshipHealth.Healthy,
  topic: "GTM",
  daysSinceLastMeeting: 3,
  openActions: 0,
  overdueActions: 0,
});

describe("CoordinatorMentorshipsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorPrograms).mockResolvedValue([coordinatorProgram()]);
    vi.mocked(getCoordinatorMentorships).mockResolvedValue([lumen, kavun]);
    vi.mocked(getCoordinatorMentorship).mockResolvedValue(
      coordinatorMentorshipDetail(),
    );
  });

  it("lists the mentorships with an intervention button on the risky one", async () => {
    renderWithQueryClient(
      <CoordinatorMentorshipsView initialSelectedId={null} />,
    );

    expect(await screen.findByText("Ayşe Demir ↔ Lumen")).toBeInTheDocument();
    expect(screen.getByText("2 açık · 1 gecikmiş")).toBeInTheDocument();
    expect(screen.getByText("18 gün önce")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ayşe Demir ↔ Lumen müdahale et" }),
    ).toHaveTextContent("Müdahale");
    expect(
      screen.getByRole("button", { name: "Ayşe Demir ↔ Kavun incele" }),
    ).toHaveTextContent("İncele");
  });

  it("reads in English, drawer included", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <CoordinatorMentorshipsView initialSelectedId={null} />
      </InLocale>,
    );

    expect(await screen.findByText("2 open · 1 overdue")).toBeInTheDocument();
    expect(screen.getByText("18 days ago")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Needs intervention 1" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Open actions")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Intervene: Ayşe Demir ↔ Lumen" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Mentorship details",
    });
    expect(
      await within(dialog).findByText(
        "No meeting for 18 days · next not scheduled",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getAllByRole("button", { name: "Remind both sides" })
        .length,
    ).toBeGreaterThan(0);
    expect(
      within(dialog).getByRole("tab", { name: "Summary" }),
    ).toBeInTheDocument();
  });

  it("narrows to the mentorships that need an intervention", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <CoordinatorMentorshipsView initialSelectedId={null} />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Müdahale gerekli 1" }),
    );

    expect(screen.getByText("Ayşe Demir ↔ Lumen")).toBeInTheDocument();
    expect(screen.queryByText("Ayşe Demir ↔ Kavun")).not.toBeInTheDocument();
  });

  it("reloads for the chosen program", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <CoordinatorMentorshipsView initialSelectedId={null} />,
    );
    await screen.findByText("Ayşe Demir ↔ Lumen");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Program:" }),
      "program-1",
    );

    expect(getCoordinatorMentorships).toHaveBeenLastCalledWith("program-1");
  });

  it("opens the drawer and reminds both sides", async () => {
    vi.mocked(remindCoordinatorMentorship).mockResolvedValue();
    const user = userEvent.setup();
    renderWithQueryClient(
      <CoordinatorMentorshipsView initialSelectedId={null} />,
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Ayşe Demir ↔ Lumen müdahale et",
      }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Mentorluk detayı",
    });
    expect(
      await within(dialog).findByText(
        "18 gündür görüşme yok · sıradaki planlanmadı",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("7 / 12 görev tamamlandı · %58"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Mesaj gönder" }),
    ).toHaveAttribute(
      "href",
      "/coordinator/messages?program=program-1&mentor=mentor-1",
    );

    await user.click(
      within(dialog).getAllByRole("button", { name: "İki tarafa hatırlat" })[0],
    );

    expect(remindCoordinatorMentorship).toHaveBeenCalledWith("mentorship-1");
    expect(
      await within(dialog).findAllByText("Hatırlatma gönderildi"),
    ).not.toHaveLength(0);
  });

  it("opens straight into the drawer from a deep link and closes on Escape", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <CoordinatorMentorshipsView initialSelectedId="mentorship-1" />,
    );

    expect(
      await screen.findByRole("dialog", { name: "Mentorluk detayı" }),
    ).toBeInTheDocument();
    expect(getCoordinatorMentorship).toHaveBeenCalledWith("mentorship-1");

    await user.click(await screen.findByRole("tab", { name: /Görüşmeler/ }));
    expect(screen.getByText("Nakit akışı")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pages twenty rows at a time", async () => {
    vi.mocked(getCoordinatorMentorships).mockResolvedValue(
      Array.from({ length: 23 }, (_, index) =>
        coordinatorMentorship({
          id: `mentorship-${index}`,
          organizationName: `Takım ${index}`,
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithQueryClient(
      <CoordinatorMentorshipsView initialSelectedId={null} />,
    );

    expect(await screen.findAllByText(/^Ayşe Demir ↔ Takım/)).toHaveLength(20);
    await user.click(screen.getByRole("button", { name: /Daha fazla yükle/ }));

    expect(screen.getAllByText(/^Ayşe Demir ↔ Takım/)).toHaveLength(23);
    expect(
      screen.queryByRole("button", { name: /Daha fazla yükle/ }),
    ).not.toBeInTheDocument();
  });
});
