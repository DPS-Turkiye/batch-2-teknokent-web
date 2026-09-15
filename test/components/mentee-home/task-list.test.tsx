import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TaskList } from "@/components/mentee-home/task-list";
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
    expect(screen.getByRole("link", { name: /Tümünü gör/ })).toHaveAttribute(
      "href",
      "/mentorships",
    );
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
});
