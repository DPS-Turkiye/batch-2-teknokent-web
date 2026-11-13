import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramWeekPlanEditor } from "@/components/coordinator/program-week-plan-editor";
import { useProgramWeekPlan } from "@/hooks/use-program-week-plan";
import {
  getProgramWeekPlan,
  saveProgramWeekPlan,
} from "@/lib/client/program-weeks";
import { itemAt } from "@test/fixtures/list-assertions";
import { planWeek } from "@test/fixtures/program-week";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/program-weeks", () => ({
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
    .mockResolvedValue({ totalWeeks: 4, weeks: [planWeek()] });
  vi.mocked(saveProgramWeekPlan)
    .mockReset()
    .mockImplementation(async (_id, weeks) => ({
      totalWeeks: 4,
      weeks: weeks.map((week) => ({ ...week, startDate: null, endDate: null })),
    }));
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
    vi.mocked(getProgramWeekPlan).mockResolvedValue({
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
    });
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

    expect(saveProgramWeekPlan).toHaveBeenCalledWith("program-1", [
      {
        week: 1,
        title: "Tanışma",
        topics: ["Program tanıtımı", "Ekip kurma"],
        activities: [],
        deliverables: [],
        inferred: false,
      },
      {
        week: 2,
        title: "Kullanıcı görüşmeleri",
        topics: ["Problem tanımı", "Hedef kitle"],
        activities: ["5 kullanıcıyla görüş"],
        deliverables: ["Görüşme notları"],
        inferred: true,
      },
    ]);
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
});
