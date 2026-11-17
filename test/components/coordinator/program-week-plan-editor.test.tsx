import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramWeekPlanEditor } from "@/components/coordinator/program-week-plan-editor";
import { useProgramWeekPlan } from "@/hooks/use-program-week-plan";
import {
  alignProgramDates,
  getProgramWeekPlan,
  saveProgramWeekPlan,
} from "@/lib/client/program-weeks";
import { itemAt } from "@test/fixtures/list-assertions";
import {
  planSession,
  planWeek,
  specialDay,
  weekPlan,
} from "@test/fixtures/program-week";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-weeks", () => ({
  alignProgramDates: vi.fn(),
  getProgramWeekPlan: vi.fn(),
  saveProgramWeekPlan: vi.fn(),
}));

// Four weeks: 5–11, 12–18, 19–25 and 26–28 October.
const PROGRAM = { startDate: "2026-10-05", endDate: "2026-10-28" };
function Harness({ locked = false }: { locked?: boolean }) {
  const plan = useProgramWeekPlan("program-1", PROGRAM);
  return <ProgramWeekPlanEditor plan={plan} locked={locked} />;
}

beforeEach(() => {
  vi.mocked(getProgramWeekPlan)
    .mockReset()
    .mockResolvedValue(weekPlan({ totalWeeks: 4, weeks: [planWeek()] }));
  vi.mocked(saveProgramWeekPlan)
    .mockReset()
    .mockImplementation(async (_id, weeks) =>
      weekPlan({
        totalWeeks: 4,
        weeks: weeks.map((week) => ({
          ...week,
          startDate: null,
          endDate: null,
          datesFromSource: false,
        })),
      }),
    );
});

function weekRows() {
  return within(
    screen.getByRole("list", { name: "Haftalık plan" }),
  ).getAllByRole("listitem");
}

function weekRow(index: number) {
  return itemAt(weekRows(), index);
}

describe("ProgramWeekPlanEditor", () => {
  it("shows the saved weeks with their days, and no save button until something changes", async () => {
    renderWithQueryClient(<Harness />);

    expect(
      await screen.findByDisplayValue("Kullanıcı görüşmeleri"),
    ).toBeVisible();
    expect(screen.getByText("12 Eki – 18 Eki")).toBeVisible();
    expect(screen.getByText(/Program 4 hafta sürüyor/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Haftalık planı kaydet" }),
    ).toBeNull();
  });

  it("keeps a week's own row when a new week is sorted in above it", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Harness />);
    const savedTitle = await screen.findByDisplayValue("Kullanıcı görüşmeleri");

    await user.click(screen.getByRole("button", { name: "Hafta ekle" }));

    // Week 1 is free, so it lands first. Keyed by position, week 2's input would now be reused for it.
    expect(weekRows()).toHaveLength(2);
    expect(screen.getByDisplayValue("Kullanıcı görüşmeleri")).toBe(savedTitle);
    expect(within(weekRow(1)).getByDisplayValue("Kullanıcı görüşmeleri")).toBe(
      savedTitle,
    );
  });

  it("marks a week spread out from a phase and saves edited lines trimmed", async () => {
    vi.mocked(getProgramWeekPlan).mockResolvedValue(
      weekPlan({
        totalWeeks: 4,
        weeks: [
          planWeek({
            week: 1,
            title: "Tanışma",
            topics: [],
            activities: [],
            deliverables: [],
          }),
          planWeek({ week: 2, inferred: true }),
        ],
      }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<Harness />);
    await screen.findByDisplayValue("Kullanıcı görüşmeleri");
    expect(within(weekRow(1)).getByText("Fazdan bölündü")).toBeVisible();

    const topics = within(weekRow(0)).getByRole("textbox", {
      name: "Konular",
    });
    await user.type(topics, "Program tanıtımı{enter}  Ekip kurma ");
    await user.click(
      screen.getByRole("button", { name: "Haftalık planı kaydet" }),
    );

    expect(saveProgramWeekPlan).toHaveBeenCalledWith(
      "program-1",
      [
        {
          week: 1,
          title: "Tanışma",
          topics: ["Program tanıtımı", "Ekip kurma"],
          activities: [],
          deliverables: [],
          inferred: false,
          startDate: null,
          endDate: null,
          sessions: [],
        },
        {
          week: 2,
          title: "Kullanıcı görüşmeleri",
          topics: ["Problem tanımı", "Hedef kitle"],
          activities: ["5 kullanıcıyla görüş"],
          deliverables: ["Görüşme notları"],
          inferred: true,
          startDate: null,
          endDate: null,
          sessions: [],
        },
      ],
      [],
    );
    expect(await screen.findByText("Haftalık plan kaydedildi.")).toBeVisible();
  });

  it("adds the next free week, and refuses to save it without a title", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Harness />);
    await screen.findByDisplayValue("Kullanıcı görüşmeleri");

    await user.click(screen.getByRole("button", { name: "Hafta ekle" }));
    expect(weekRows()).toHaveLength(2);
    expect(within(weekRow(0)).getByRole("spinbutton")).toHaveValue(1);
    await user.click(
      screen.getByRole("button", { name: "Haftalık planı kaydet" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Her haftaya bir başlık yaz.",
    );
    expect(saveProgramWeekPlan).not.toHaveBeenCalled();
  });

  it("removes a week and can throw the draft away", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Harness />);
    await screen.findByDisplayValue("Kullanıcı görüşmeleri");

    await user.click(
      screen.getByRole("button", { name: "Hafta 2 haftasını kaldır" }),
    );
    expect(screen.getByText(/Henüz haftalık plan yok/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Vazgeç" }));
    expect(screen.getByDisplayValue("Kullanıcı görüşmeleri")).toBeVisible();
  });

  it("is read-only for an admin or an archived program", async () => {
    renderWithQueryClient(<Harness locked />);
    await screen.findByDisplayValue("Kullanıcı görüşmeleri");

    expect(screen.getByRole("button", { name: "Hafta ekle" })).toBeDisabled();
    expect(screen.getByDisplayValue("Kullanıcı görüşmeleri")).toBeDisabled();
  });
  it("shows admins a mismatch without the alignment action", async () => {
    vi.mocked(getProgramWeekPlan).mockResolvedValue(
      weekPlan({
        totalWeeks: 4,
        weeks: [planWeek()],
        dateCheck: { syllabusStart: "2026-11-09", syllabusEnd: "2026-12-15" },
      }),
    );
    renderWithQueryClient(<Harness locked />);
    expect(
      await screen.findByText(
        "Müfredat 9 Kas 2026 – 15 Ara 2026 tarihlerini veriyor; program ise 5 Eki 2026 – 28 Eki 2026 olarak kayıtlı.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name: "Programın tarihlerini müfredata göre güncelle",
      }),
    ).toBeNull();
    expect(alignProgramDates).not.toHaveBeenCalled();
  });

  it("lets the coordinator align the saved syllabus dates", async () => {
    vi.mocked(getProgramWeekPlan).mockResolvedValue(
      weekPlan({
        totalWeeks: 4,
        weeks: [planWeek()],
        dateCheck: { syllabusStart: "2026-11-09", syllabusEnd: "2026-12-15" },
      }),
    );
    vi.mocked(alignProgramDates).mockResolvedValue(
      weekPlan({
        totalWeeks: 6,
        weeks: [planWeek()],
        dateCheck: null,
      }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<Harness />);
    await user.click(
      await screen.findByRole("button", {
        name: "Programın tarihlerini müfredata göre güncelle",
      }),
    );
    expect(alignProgramDates).toHaveBeenCalledWith("program-1");
    expect(
      await screen.findByText("Program tarihleri güncellendi."),
    ).toBeVisible();
  });

  it("shows a week's printed days and sessions, and the plan's special days", async () => {
    vi.mocked(getProgramWeekPlan).mockResolvedValue(
      weekPlan({
        totalWeeks: 4,
        weeks: [
          planWeek({
            week: 1,
            datesFromSource: true,
            startDate: "2026-10-06",
            endDate: "2026-10-10",
            sessions: [planSession({ date: "2026-10-06" })],
          }),
        ],
        specialDays: [specialDay({ date: "2026-10-28" })],
      }),
    );
    renderWithQueryClient(<Harness />);

    expect(await screen.findByText("6 Eki – 10 Eki")).toBeVisible();
    expect(screen.getByDisplayValue("2026-10-06")).toBeVisible();
    expect(
      within(
        screen.getByRole("list", { name: "1. haftanın oturumları" }),
      ).getByText("Sal 6 Eki · 18:00–20:00 · Online · Yapılandırılmış eğitim"),
    ).toBeVisible();
    expect(
      within(screen.getByRole("list", { name: "Özel günler" })).getByText(
        "Çar 28 Eki · 15:00 · KKM · Demo Günü",
      ),
    ).toBeVisible();
  });

  it("saves edited week dates and sends the saved special days back unchanged", async () => {
    vi.mocked(getProgramWeekPlan).mockResolvedValue(
      weekPlan({
        totalWeeks: 4,
        weeks: [planWeek({ week: 1 })],
        specialDays: [specialDay()],
      }),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<Harness />);

    // jsdom's date input takes a value only through a change event.
    fireEvent.change(await screen.findByLabelText("Hafta başlangıcı"), {
      target: { value: "2026-10-06" },
    });
    fireEvent.change(screen.getByLabelText("Hafta bitişi"), {
      target: { value: "2026-10-10" },
    });
    await user.click(
      screen.getByRole("button", { name: "Haftalık planı kaydet" }),
    );

    expect(saveProgramWeekPlan).toHaveBeenCalledWith(
      "program-1",
      [
        expect.objectContaining({
          week: 1,
          startDate: "2026-10-06",
          endDate: "2026-10-10",
        }),
      ],
      [specialDay()],
    );
  });

  it("offers no new week until the plan has loaded, so a save cannot drop its special days", async () => {
    vi.mocked(getProgramWeekPlan).mockReturnValue(new Promise(() => {}));
    renderWithQueryClient(<Harness />);

    expect(await screen.findByRole("status")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hafta ekle" })).toBeDisabled();
  });
});
