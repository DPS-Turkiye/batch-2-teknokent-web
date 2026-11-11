import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TaskNotebookDialog } from "@/components/mentee-home/task-notebook-dialog";
import { useTaskNotebook } from "@/hooks/use-task-notebook";
import { ActionItemStatus, type ActionItem } from "@/interfaces/action-item";
import type { HomeTask } from "@/lib/mentee-home";
import { DueTone, HomeTaskKind } from "@/types/mentee-home";

vi.mock("@/hooks/use-task-notebook", () => ({
  useTaskNotebook: vi.fn(),
}));

const toggle = vi.fn();

function item(id: string, title: string, status: ActionItemStatus): ActionItem {
  return {
    id,
    organizationId: "org-1",
    ownerId: "founder-1",
    title,
    status,
    createdAt: "2026-09-20T09:00:00Z",
    updatedAt: "2026-09-20T09:00:00Z",
  };
}

const open = item("a1", "Metrik panosunu paylaş", ActionItemStatus.Open);
const done = item("a2", "Rakip analizi", ActionItemStatus.Completed);

const task: HomeTask = {
  id: "action-a1",
  kind: HomeTaskKind.ActionItem,
  title: "Metrik panosunu paylaş",
  subtitle: "Selin Kaya · UX",
  dueTone: DueTone.Overdue,
  dueLabel: "Gecikti",
  actionLabel: "Görevi aç",
  href: "/mentorships",
  requestId: "r1",
};

describe("TaskNotebookDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTaskNotebook).mockReturnValue({
      items: [open, done],
      isLoading: false,
      isError: false,
      toggle,
    });
  });

  it("shows the mentorship's tasks in the notebook, the opened one marked", () => {
    render(<TaskNotebookDialog task={task} requestId="r1" onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Yapılacaklar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Metrik panosunu paylaş" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Rakip analizi" }),
    ).toBeChecked();
    expect(
      screen.getByText("Metrik panosunu paylaş").closest("li"),
    ).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("Rakip analizi")).toHaveClass("line-through");
    expect(useTaskNotebook).toHaveBeenCalledWith("r1");
  });

  it("ticks a task from the popup and closes it", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TaskNotebookDialog task={task} requestId="r1" onClose={onClose} />);

    await user.click(
      screen.getByRole("checkbox", { name: "Metrik panosunu paylaş" }),
    );
    expect(toggle).toHaveBeenCalledWith(open, true);

    await user.click(screen.getByRole("button", { name: "Kapat" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("says when the list is still loading", () => {
    vi.mocked(useTaskNotebook).mockReturnValue({
      items: [],
      isLoading: true,
      isError: false,
      toggle,
    });
    render(<TaskNotebookDialog task={task} requestId="r1" onClose={vi.fn()} />);

    expect(screen.getByText("Liste yükleniyor…")).toBeInTheDocument();
  });
});
