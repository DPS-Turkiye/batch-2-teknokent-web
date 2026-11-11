import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingTodoList } from "@/components/notes/meeting-todo-list";
import { MeetingTodoSource, type MeetingTodo } from "@/interfaces/meeting-note";
import { getMeetingTodos, patchMeetingTodo } from "@/lib/client/meeting-notes";
import { expectLength } from "@test/fixtures/list-assertions";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/meeting-notes", () => ({
  getMeetingTodos: vi.fn(),
  patchMeetingTodo: vi.fn(),
  postMeetingTodo: vi.fn(),
  removeMeetingTodo: vi.fn(),
}));

const fromReport: MeetingTodo = {
  id: "todo-1",
  meetingId: "meeting-1",
  title: "Finansal modeli tamamla — Ayşe · 3 Ekim",
  done: false,
  displayOrder: 0,
  source: MeetingTodoSource.Ai,
};
const typed: MeetingTodo = {
  ...fromReport,
  id: "todo-2",
  title: "Pitch deck güncelle",
  displayOrder: 1,
  source: MeetingTodoSource.Manual,
};

describe("MeetingTodoList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMeetingTodos).mockResolvedValue([fromReport, typed]);
    vi.mocked(patchMeetingTodo).mockResolvedValue([fromReport, typed]);
  });

  it("marks only the tasks the meeting report added", async () => {
    renderWithQueryClient(<MeetingTodoList meetingId="meeting-1" />);

    expect(
      await screen.findByText("Finansal modeli tamamla — Ayşe · 3 Ekim"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("AI")).toHaveLength(1);
  });

  it("edits a report task's text and keeps an unchanged one as it was", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MeetingTodoList meetingId="meeting-1" />);

    const editButtons = await screen.findAllByRole("button", {
      name: "Maddeyi düzenle",
    });
    expectLength(editButtons, 2);
    const [editReportTask, editTypedTask] = editButtons;
    await user.click(editReportTask);
    const input = screen.getByRole("textbox", { name: "Maddeyi düzenle" });
    await user.clear(input);
    await user.type(input, "Finansal modeli Cuma'ya bitir{Enter}");

    expect(patchMeetingTodo).toHaveBeenCalledWith("meeting-1", "todo-1", {
      title: "Finansal modeli Cuma'ya bitir",
      done: undefined,
    });

    await user.click(editTypedTask);
    await user.keyboard("{Escape}");
    expect(patchMeetingTodo).toHaveBeenCalledTimes(1);
  });
});
