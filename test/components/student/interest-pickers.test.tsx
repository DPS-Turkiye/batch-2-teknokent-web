import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  GoalField,
  STUDENT_GOAL_MAX,
  SubtopicPicker,
  TopicPicker,
} from "@/components/student/interest-pickers";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { PROFILE_COMPLETION_CATEGORIES } from "@/lib/client/fixtures/student-profile-completion";
import { itemAt } from "@test/fixtures/list-assertions";
import { InLocale } from "@test/test-utils";

const career = itemAt(PROFILE_COMPLETION_CATEGORIES, 1);

describe("TopicPicker", () => {
  it("shows each category as a card and reports a toggle", async () => {
    const onToggle = vi.fn<(id: PeerTopicCategory) => void>();
    render(
      <InLocale locale="tr">
        <TopicPicker
          categories={PROFILE_COMPLETION_CATEGORIES}
          selected={[PeerTopicCategory.CareerInternship]}
          onToggle={onToggle}
        />
      </InLocale>,
    );

    const group = screen.getByRole("group", {
      name: "Hangi konularda destek almak istersin?",
    });
    expect(within(group).getAllByRole("checkbox")).toHaveLength(
      PROFILE_COMPLETION_CATEGORIES.length,
    );
    expect(
      within(group).getByRole("checkbox", { name: "Kariyer ve Staj" }),
    ).toBeChecked();

    await userEvent.click(
      within(group).getByRole("checkbox", { name: "Uluslararası Fırsatlar" }),
    );
    expect(onToggle).toHaveBeenCalledWith(PeerTopicCategory.International);
  });

  it("says so when the program has no active category", () => {
    render(
      <InLocale locale="tr">
        <TopicPicker categories={[]} selected={[]} onToggle={vi.fn()} />
      </InLocale>,
    );
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(
      screen.getByText(
        "Programında henüz etkin kategori yok. Koordinatörün kategorileri açtığında burada seçebilirsin.",
      ),
    ).toBeVisible();
  });
});

describe("SubtopicPicker", () => {
  it("lists the chosen categories' sub-topics as chips and reports a toggle", async () => {
    const onToggle = vi.fn<(id: string) => void>();
    render(
      <InLocale locale="tr">
        <SubtopicPicker
          groups={[career]}
          selected={["fixture-cv"]}
          onToggle={onToggle}
        />
      </InLocale>,
    );

    const section = screen.getByRole("region", { name: "Alt konular" });
    const chip = within(section).getByRole("checkbox", {
      name: "Örnek: CV hazırlama",
    });
    expect(chip).toBeChecked();
    await userEvent.click(chip);
    expect(onToggle).toHaveBeenCalledWith("fixture-cv");
  });

  it("asks for a category first", () => {
    render(
      <InLocale locale="tr">
        <SubtopicPicker groups={[]} selected={[]} onToggle={vi.fn()} />
      </InLocale>,
    );
    expect(
      screen.getByText("Bir konu seçtiğinde alt konuları burada görürsün."),
    ).toBeVisible();
  });
});

describe("GoalField", () => {
  it("is a labelled text box with the limit and a live count", async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(
      <InLocale locale="tr">
        <GoalField value="Staj" onChange={onChange} />
      </InLocale>,
    );

    const box = screen.getByRole("textbox", { name: "Hedefin veya beklentin" });
    expect(box).toHaveAttribute("maxLength", String(STUDENT_GOAL_MAX));
    expect(
      screen.getByText(`En fazla ${STUDENT_GOAL_MAX} karakter`),
    ).toBeVisible();
    expect(screen.getByText(`4 / ${STUDENT_GOAL_MAX}`)).toBeVisible();

    await userEvent.type(box, "!");
    expect(onChange).toHaveBeenCalledWith("Staj!");
  });
});
