"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { MobileButton } from "@/components/mobile/mobile-button";
import {
  MobileEmptyState,
  MobileErrorState,
  MobileListSkeleton,
} from "@/components/mobile/mobile-states";
import { MobileTaskTab, useMobileTasks } from "@/hooks/use-mobile-tasks";
import {
  MobileButtonVariant,
  MobileTaskSource,
  MobileTaskTone,
  type MobileTask,
} from "@/interfaces/mobile";
import { initials } from "@/lib/utils";

type Tasks = ReturnType<typeof useMobileTasks>;

const META_CLASS: Record<MobileTaskTone, string> = {
  [MobileTaskTone.Overdue]: "text-[#d9464b]",
  [MobileTaskTone.Today]: "text-[#b7791f]",
  [MobileTaskTone.Later]: "text-[#858c96]",
};

const DUE_CHIP_CLASS: Record<MobileTaskTone, string> = {
  [MobileTaskTone.Overdue]: "bg-[#fdeeee] text-[#d9464b]",
  [MobileTaskTone.Today]: "bg-[#fff6e5] text-[#b7791f]",
  [MobileTaskTone.Later]: "bg-[#f5f6f8] text-[#676e78]",
};

function Checkbox({ task, tasks }: { task: MobileTask; tasks: Tasks }) {
  const t = useTranslations("mobile.tasks");
  if (!tasks.canTick(task)) {
    return (
      <span
        aria-hidden="true"
        className="size-[26px] shrink-0 rounded-lg border-[1.8px] border-dashed border-[#cbd0d6]"
      />
    );
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={task.completed}
      aria-label={t(task.completed ? "checkboxDone" : "checkboxOpen", {
        title: task.title,
      })}
      disabled={tasks.isSaving}
      onClick={() =>
        task.completed ? tasks.reopen(task) : tasks.complete(task)
      }
      className={`flex size-[26px] shrink-0 items-center justify-center rounded-lg ${
        task.completed
          ? "bg-[var(--mobile-accent)]"
          : "border-[1.8px] border-[#cbd0d6]"
      }`}
    >
      {task.completed ? (
        <Image src="/mobile/icon-done.svg" alt="" width={16} height={16} />
      ) : null}
    </button>
  );
}

function TaskRow({ task, tasks }: { task: MobileTask; tasks: Tasks }) {
  return (
    <li className="flex items-center gap-3.5 border-b border-[#f0f2f4] px-1 py-3.5 last:border-b-0">
      <Checkbox task={task} tasks={tasks} />
      <button
        type="button"
        onClick={() => tasks.openTask(task.id)}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.35]">
          <span
            className={`text-[15.5px] font-medium ${
              task.completed ? "text-[#858c96] line-through" : "text-[#22262b]"
            }`}
          >
            {task.title}
          </span>
          <span
            className={`text-[13px] ${
              task.completed ? "text-[#aeb4bc]" : META_CLASS[task.tone]
            }`}
          >
            {task.meta}
          </span>
        </span>
        <Image
          src="/mobile/icon-chevron-right.svg"
          alt=""
          width={18}
          height={18}
        />
      </button>
    </li>
  );
}

function TaskSheet({ tasks }: { tasks: Tasks }) {
  const t = useTranslations("mobile.tasks");
  const task = tasks.selected;
  if (!task) return null;
  return (
    <BottomSheet labelledBy="task-title" onClose={tasks.closeTask}>
      {task.assignedBy ? (
        <p className="flex items-center gap-2 text-[13px] leading-[1.35] font-medium text-[#1583d6]">
          <span className="flex size-[26px] items-center justify-center rounded-full bg-[#eaf6ff] text-[9px] font-semibold">
            {initials(task.assignedBy)}
          </span>
          {task.assignedOn
            ? t("assignedBy", { name: task.assignedBy, date: task.assignedOn })
            : task.assignedBy}
        </p>
      ) : null}
      <h2
        id="task-title"
        className="text-[22px] leading-[1.35] font-bold text-[#22262b]"
      >
        {task.title}
      </h2>
      <div className="flex flex-wrap gap-2 text-xs leading-[1.35] font-medium">
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-[5px] ${DUE_CHIP_CLASS[task.tone]}`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {task.dueLabel}
        </span>
        {task.chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-[#e9ecef] bg-white px-2.5 py-[5px] text-[#676e78]"
          >
            {chip}
          </span>
        ))}
      </div>
      {task.description ? (
        <p className="text-[15px] leading-[1.55] whitespace-pre-line text-[#22262b]">
          {task.description}
        </p>
      ) : null}
      <div className="flex flex-col gap-2.5 pt-2">
        {tasks.canTick(task) && !task.completed ? (
          <MobileButton
            variant={MobileButtonVariant.Primary}
            onClick={() => tasks.complete(task)}
            disabled={tasks.isSaving}
          >
            <Image src="/mobile/icon-done.svg" alt="" width={18} height={18} />
            {t("markDone")}
          </MobileButton>
        ) : null}
        {task.webHref ? (
          <a
            href={task.webHref}
            className="flex w-full items-center justify-center rounded-full bg-[var(--mobile-accent)] px-[22px] py-[15px] text-[15px] leading-[1.35] font-semibold text-white"
          >
            {task.source === MobileTaskSource.Feedback
              ? t("rateOnWeb")
              : t("submitOnWeb")}
          </a>
        ) : null}
        {task.chatHref ? (
          <Link
            href={task.chatHref}
            className="flex w-full items-center justify-center rounded-full px-[22px] py-[15px] text-[15px] leading-[1.35] font-semibold text-[#22262b]"
          >
            {t("messageMentor")}
          </Link>
        ) : null}
      </div>
    </BottomSheet>
  );
}

function Segments({ tasks }: { tasks: Tasks }) {
  const t = useTranslations("mobile.tasks");
  const options = [
    { tab: MobileTaskTab.Open, label: t("tabOpen"), count: tasks.counts.open },
    { tab: MobileTaskTab.Done, label: t("tabDone"), count: tasks.counts.done },
  ];
  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-full bg-[#f5f6f8] p-1 leading-[1.35]"
    >
      {options.map((option) => {
        const active = tasks.tab === option.tab;
        return (
          <button
            key={option.tab}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => tasks.setTab(option.tab)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm ${
              active
                ? "bg-white font-semibold text-[#22262b] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]"
                : "font-medium text-[#676e78]"
            }`}
          >
            {option.label}
            <span className="text-[13px] font-medium text-[#858c96]">
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MobileTasksView() {
  const t = useTranslations("mobile.tasks");
  const tasks = useMobileTasks();

  return (
    <>
      <MobileScreenHeader title={t("title")} />
      <div className="flex flex-col gap-[18px]">
        <Segments tasks={tasks} />
        {tasks.isLoading ? (
          <MobileListSkeleton />
        ) : tasks.isError ? (
          <MobileErrorState title={t("loadError")} onRetry={tasks.retry} />
        ) : tasks.tab === MobileTaskTab.Open ? (
          tasks.groups.length === 0 ? (
            <MobileEmptyState
              icon="/mobile/icon-tasks.svg"
              title={t("emptyOpenTitle")}
              description={t("emptyOpenDescription")}
            />
          ) : (
            tasks.groups.map((group) => (
              <section
                key={group.key}
                aria-label={group.label}
                className="flex flex-col gap-0.5"
              >
                <h2 className="flex items-center gap-2 pt-1.5 pb-1 leading-[1.35]">
                  <span
                    className={`text-sm font-semibold ${
                      group.urgent ? "text-[#d9464b]" : "text-[#676e78]"
                    }`}
                  >
                    {group.label}
                  </span>
                  <span className="text-[13px] font-medium text-[#858c96]">
                    {group.tasks.length}
                  </span>
                </h2>
                <ul>
                  {group.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} tasks={tasks} />
                  ))}
                </ul>
              </section>
            ))
          )
        ) : tasks.done.length === 0 ? (
          <MobileEmptyState
            icon="/mobile/icon-tasks.svg"
            title={t("emptyDoneTitle")}
            description={t("emptyDoneDescription")}
          />
        ) : (
          <ul aria-label={t("doneList")}>
            {tasks.done.map((task) => (
              <TaskRow key={task.id} task={task} tasks={tasks} />
            ))}
          </ul>
        )}
        {tasks.saveFailed ? (
          <p role="alert" className="text-[13px] leading-[1.35] text-[#d9464b]">
            {t("saveError")}
          </p>
        ) : null}
      </div>

      {tasks.justCompleted ? (
        <div
          role="status"
          className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-40 mx-auto flex w-[calc(100%-40px)] max-w-[440px] items-center justify-between gap-3 rounded-2xl bg-[#22262b] px-[18px] py-3 text-sm leading-[1.35] text-white"
        >
          <span>{t("completedToast")}</span>
          <button
            type="button"
            onClick={tasks.undo}
            className="font-semibold text-[#ffb27a]"
          >
            {t("undo")}
          </button>
        </div>
      ) : null}

      <TaskSheet tasks={tasks} />
    </>
  );
}
