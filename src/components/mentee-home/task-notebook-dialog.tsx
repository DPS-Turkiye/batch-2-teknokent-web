"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import {
  TodoBlankRows,
  TodoCheckbox,
  TodoNotebook,
} from "@/components/notes/todo-notebook";
import { useTaskNotebook } from "@/hooks/use-task-notebook";
import { ActionItemStatus } from "@/interfaces/action-item";
import { homeTaskId, type HomeTask } from "@/lib/mentee-home";
import { HomeTaskKind } from "@/types/mentee-home";

const TITLE_ID = "home-task-notebook-title";

export function TaskNotebookDialog({
  task,
  requestId,
  onClose,
}: {
  task: HomeTask;
  requestId: string;
  onClose: () => void;
}) {
  const tCommon = useTranslations("common");
  const t = useTranslations("notes.todo");
  const notebook = useTaskNotebook(requestId);

  return (
    <ModalDialog
      labelledBy={TITLE_ID}
      onClose={onClose}
      panelClassName="relative w-full max-w-[560px] outline-none"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={tCommon("close")}
        className="absolute right-4 top-5 z-10 grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-[#f3f4f6] hover:text-[#22262b]"
      >
        <X className="size-4" />
      </button>
      <TodoNotebook titleId={TITLE_ID} className="h-[440px]">
        {notebook.isLoading ? (
          <p className="p-3 text-sm text-[#8a8a8a]">{t("loading")}</p>
        ) : notebook.isError ? (
          <p className="p-3 text-sm text-[#9b2c2c]">{t("error")}</p>
        ) : (
          <>
            <ul>
              {notebook.items.map((item) => {
                const done = item.status === ActionItemStatus.Completed;
                const focused =
                  homeTaskId(HomeTaskKind.ActionItem, item.id) === task.id;
                return (
                  <li
                    key={item.id}
                    aria-current={focused ? "true" : undefined}
                    className={`border-b border-[#c2c2c2] ${focused ? "bg-[#fff7f1]" : ""}`}
                  >
                    <label className="flex cursor-pointer items-center gap-3 p-3">
                      <TodoCheckbox
                        checked={done}
                        onChange={(checked) => notebook.toggle(item, checked)}
                      />
                      <span
                        className={`min-w-0 flex-1 text-base leading-6 ${done ? "text-[#636e7d] line-through" : "text-[#22262b]"}`}
                      >
                        {item.title}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <TodoBlankRows used={notebook.items.length} />
          </>
        )}
      </TodoNotebook>
    </ModalDialog>
  );
}
