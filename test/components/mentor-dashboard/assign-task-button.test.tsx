import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssignTaskButton } from "@/components/mentor-dashboard/assign-task-button";
import type { ActionItem } from "@/interfaces/action-item";
import {
  assignMentorshipTask,
  getTaskAssignees,
} from "@/lib/client/mentor-task-assignment";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-task-assignment", () => ({
  assignMentorshipTask: vi.fn(),
  getTaskAssignees: vi.fn(),
}));
const ownerId = "00000000-0000-4000-8000-000000000001";
function renderButton(locale: "tr" | "en" = "tr") {
  return renderWithQueryClient(
    <InLocale locale={locale}>
      <AssignTaskButton requestId="request-1" startupName="Atlas AI" />
    </InLocale>,
  );
}
async function openAndFill() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Yeni iş ata" }));
  await screen.findByRole("option", { name: "Deniz" });
  await user.type(screen.getByLabelText("İş başlığı"), " Interview users ");
  await user.selectOptions(screen.getByLabelText("Atanan kişi"), ownerId);
  return user;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTaskAssignees).mockResolvedValue([
    { id: ownerId, fullName: "Deniz" },
  ]);
  vi.mocked(assignMentorshipTask).mockResolvedValue({
    id: "task-1",
  } as ActionItem);
});
describe("mentor task assignment dialog", () => {
  it("loads no roster until opened and shows the selected startup", async () => {
    renderButton();
    expect(getTaskAssignees).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Yeni iş ata" }));
    expect(
      await screen.findByRole("dialog", { name: "İş ata" }),
    ).toHaveTextContent("Atlas AI");
    expect(getTaskAssignees).toHaveBeenCalledWith("request-1");
    expect(screen.getByRole("button", { name: "İşi ata" })).toBeDisabled();
  });
  it("submits the correct task, preserves a date and refreshes existing task queries", async () => {
    const { queryClient } = renderButton();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const user = await openAndFill();
    await user.type(
      screen.getByLabelText("Açıklama (isteğe bağlı)"),
      "Five interviews",
    );
    fireEvent.change(screen.getByLabelText("Teslim tarihi (isteğe bağlı)"), {
      target: { value: "2026-12-01" },
    });
    await user.click(screen.getByRole("button", { name: "İşi ata" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(assignMentorshipTask).toHaveBeenCalledWith("request-1", {
      ownerId,
      title: "Interview users",
      description: "Five interviews",
      dueDate: "2026-12-01",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["action-items"] });
    expect(await screen.findByText("İş atandı.")).toBeInTheDocument();
  });
  it("keeps entries on a failed save and allows retry", async () => {
    vi.mocked(assignMentorshipTask).mockRejectedValueOnce(
      new Error("Unavailable"),
    );
    renderButton();
    const user = await openAndFill();
    await user.click(screen.getByRole("button", { name: "İşi ata" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("İş atanamadı");
    expect(screen.getByLabelText("İş başlığı")).toHaveValue(
      " Interview users ",
    );
    await user.click(screen.getByRole("button", { name: "İşi ata" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(assignMentorshipTask).toHaveBeenCalledTimes(2);
  });
  it("prevents repeated submissions and closing while saving", async () => {
    let resolve!: (item: ActionItem) => void;
    vi.mocked(assignMentorshipTask).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    renderButton();
    const user = await openAndFill();
    const submit = screen.getByRole("button", { name: "İşi ata" });
    fireEvent.submit(submit.closest("form")!);
    fireEvent.submit(submit.closest("form")!);
    await waitFor(() => expect(assignMentorshipTask).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Vazgeç" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    resolve({ id: "task-1" } as ActionItem);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("shows roster failures with retry and refuses an empty roster", async () => {
    vi.mocked(getTaskAssignees)
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce([]);
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: "Yeni iş ata" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Startup üyeleri yüklenemedi",
    );
    await userEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    expect(
      await screen.findByText("İş atanabilecek onaylı bir startup üyesi yok."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "İşi ata" })).toBeDisabled();
  });
  it("uses English labels and returns focus to the trigger on cancel", async () => {
    renderButton("en");
    const trigger = screen.getByRole("button", { name: "Assign a task" });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Assign a task" });
    expect(within(dialog).getByLabelText("Task title")).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Cancel" }),
    );
    expect(trigger).toHaveFocus();
    expect(assignMentorshipTask).not.toHaveBeenCalled();
  });
});
