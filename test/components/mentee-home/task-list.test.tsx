import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskList } from "@/components/mentee-home/task-list";
import { HOME_TASK_LABELS } from "@/lib/const/mentee-home";
import type { HomeTask } from "@/lib/mentee-home";
import { DueTone, HomeTaskKind } from "@/types/mentee-home";

function task(overrides: Partial<HomeTask> = {}): HomeTask {
  return {
    id: "action-a1",
    kind: HomeTaskKind.ActionItem,
    title: "Pitch deck'i güncelle",
    subtitle: "Selin Kaya · Finans Mentorluğu",
    dueTone: DueTone.Overdue,
    dueLabel: "Gecikti",
    actionLabel: "Görevi aç",
    href: "/mentor-request/status?id=r3",
    ...overrides,
  };
}

describe("TaskList", () => {
  it("lists each task with its subtitle, due chip and action", () => {
    render(
      <TaskList
        tasks={[
          task(),
          task({
            id: "request-r1",
            kind: HomeTaskKind.RequestReply,
            title: "Mentor talebini yanıtla",
            subtitle: "Barış Öztürk · Teknik ekip kurulumu",
            dueTone: DueTone.Today,
            dueLabel: "Bilgi bekliyor",
            actionLabel: "Yanıtla",
            href: "/mentor-request/status?id=r1",
          }),
        ]}
        loading={false}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Yapılacaklar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Selin Kaya · Finans Mentorluğu"),
    ).toBeInTheDocument();
    expect(screen.getByText("Gecikti")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Görevi aç: Pitch deck'i güncelle" }),
    ).toHaveAttribute("href", "/mentor-request/status?id=r3");
    expect(
      screen.getByRole("link", { name: "Yanıtla: Mentor talebini yanıtla" }),
    ).toHaveAttribute("href", "/mentor-request/status?id=r1");
    expect(
      screen.queryByRole("link", { name: /Tümünü gör/ }),
    ).not.toBeInTheDocument();
  });

  it("shows at most four tasks", () => {
    render(
      <TaskList
        tasks={Array.from({ length: 6 }, (_, index) =>
          task({ id: `action-${index}`, title: `Görev ${index}` }),
        )}
        loading={false}
      />,
    );

    expect(screen.getAllByRole("link", { name: /^Görevi aç:/ })).toHaveLength(
      4,
    );
  });

  it("shows the empty state only once loading has finished", () => {
    const { rerender } = render(<TaskList tasks={[]} loading />);
    expect(
      screen.queryByText("Şu anda yapılacak bir işin yok."),
    ).not.toBeInTheDocument();

    rerender(<TaskList tasks={[]} loading={false} />);
    expect(
      screen.getByText("Şu anda yapılacak bir işin yok."),
    ).toBeInTheDocument();
  });

  it("lets the mentee dismiss a task from the list", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <TaskList
        tasks={[
          task({
            id: "feedback-ended-1",
            kind: HomeTaskKind.MeetingFeedback,
            title: HOME_TASK_LABELS.feedbackTitle,
            actionLabel: HOME_TASK_LABELS.feedbackAction,
            href: "/meetings/research/feedback?id=ended-1",
          }),
        ]}
        loading={false}
        onDismiss={onDismiss}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: `${HOME_TASK_LABELS.dismiss}: ${HOME_TASK_LABELS.feedbackTitle}`,
      }),
    );
    expect(onDismiss).toHaveBeenCalledWith("feedback-ended-1");
  });
});
