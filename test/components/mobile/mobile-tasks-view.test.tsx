import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileTasksView } from "@/components/mobile/mobile-tasks-view";
import { MobileTaskTab, type useMobileTasks } from "@/hooks/use-mobile-tasks";
import {
  MobileTaskSource,
  MobileTaskTone,
  type MobileTask,
} from "@/interfaces/mobile";

type Tasks = ReturnType<typeof useMobileTasks>;

vi.mock("next/link", () => import("@test/mocks/next-link"));

vi.mock("@/hooks/use-mobile-tasks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-mobile-tasks")>()),
  useMobileTasks: () => tasks,
}));

const complete = vi.fn();
const openTask = vi.fn();
const undo = vi.fn();
const setTab = vi.fn();
let tasks: Tasks;

const MENTOR_TASK: MobileTask = {
  id: "action:a1",
  source: MobileTaskSource.Mentorship,
  title: "Müşteri görüşme notlarını özetle",
  description: "Üç noktayı güncelle.",
  dueAt: new Date(2026, 8, 22),
  dueLabel: "Dün",
  tone: MobileTaskTone.Overdue,
  meta: "Dün · Nihan Öztürk",
  assignedBy: "Nihan Öztürk",
  assignedOn: "19 Eylül",
  chips: ["Ürün stratejisi mentorluğu"],
  completed: false,
  requestId: "r1",
  chatHref: "/m/messages/mentorship/r1",
  webHref: null,
};

const PROCESS_TASK: MobileTask = {
  ...MENTOR_TASK,
  id: "process:p1",
  source: MobileTaskSource.Process,
  title: "Finansal model",
  tone: MobileTaskTone.Later,
  meta: "10 Ekim · Burcu Şen",
  requestId: null,
  chatHref: null,
  webHref: "/startup/process?web=1",
};

function tasksState(overrides: Partial<Tasks> = {}): Tasks {
  return {
    canTick: (task) => task.source === MobileTaskSource.Mentorship,
    closeTask: vi.fn(),
    complete,
    counts: { open: 2, done: 0 },
    done: [],
    groups: [
      { key: "overdue", label: "Gecikmiş", urgent: true, tasks: [MENTOR_TASK] },
      {
        key: "later",
        label: "Daha sonra",
        urgent: false,
        tasks: [PROCESS_TASK],
      },
    ],
    isError: false,
    isLoading: false,
    isSaving: false,
    justCompleted: null,
    openTask,
    reopen: vi.fn(),
    retry: vi.fn(),
    saveFailed: false,
    selected: null,
    setTab,
    tab: MobileTaskTab.Open,
    undo,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  tasks = tasksState();
});

describe("MobileTasksView", () => {
  it("shows the counts and groups tasks by urgency", () => {
    render(<MobileTasksView />);

    expect(screen.getByRole("tab", { name: /Yapılacak/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const overdue = screen.getByRole("region", { name: "Gecikmiş" });
    expect(within(overdue).getByText("Dün · Nihan Öztürk")).toBeInTheDocument();
  });

  it("ticks a mentorship task off, but not a process task", async () => {
    render(<MobileTasksView />);

    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Müşteri görüşme notlarını özetle: tamamla",
      }),
    );

    expect(complete).toHaveBeenCalledWith(MENTOR_TASK);
    expect(
      screen.queryByRole("checkbox", { name: /Finansal model/ }),
    ).toBeNull();
  });

  it("opens a task and switches tabs", async () => {
    render(<MobileTasksView />);

    await userEvent.click(
      screen.getByRole("button", { name: /Finansal model/ }),
    );
    await userEvent.click(screen.getByRole("tab", { name: /Tamamlanan/ }));

    expect(openTask).toHaveBeenCalledWith("process:p1");
    expect(setTab).toHaveBeenCalledWith(MobileTaskTab.Done);
  });

  it("shows a mentorship task's sheet with completion and the chat", async () => {
    tasks = tasksState({ selected: MENTOR_TASK });
    render(<MobileTasksView />);

    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getByText("Nihan Öztürk atadı · 19 Eylül"),
    ).toBeInTheDocument();
    await userEvent.click(
      within(sheet).getByRole("button", { name: "Tamamlandı olarak işaretle" }),
    );
    expect(complete).toHaveBeenCalledWith(MENTOR_TASK);
    const chat = within(sheet).getByRole("link", {
      name: "Mentora mesaj gönder",
    });
    expect(chat).toHaveAttribute("href", "/m/messages/mentorship/r1");
    expect(chat).toHaveAttribute("data-next-link");
  });

  it("sends a process task to the web to hand it in", () => {
    tasks = tasksState({ selected: PROCESS_TASK });
    render(<MobileTasksView />);

    const sheet = screen.getByRole("dialog");
    const webLink = within(sheet).getByRole("link", {
      name: "Web’de teslim et",
    });
    expect(webLink).toHaveAttribute("href", "/startup/process?web=1");
    expect(webLink).not.toHaveAttribute("data-next-link");
    expect(
      within(sheet).queryByRole("button", {
        name: "Tamamlandı olarak işaretle",
      }),
    ).toBeNull();
  });

  it("offers to undo a completion", async () => {
    tasks = tasksState({ justCompleted: MENTOR_TASK });
    render(<MobileTasksView />);

    await userEvent.click(screen.getByRole("button", { name: "Geri al" }));

    expect(undo).toHaveBeenCalled();
  });

  it("explains an empty to-do list", () => {
    tasks = tasksState({ groups: [], counts: { open: 0, done: 4 } });
    render(<MobileTasksView />);

    expect(
      screen.getByText("Şimdilik yapılacak bir görevin yok."),
    ).toBeInTheDocument();
  });
});
