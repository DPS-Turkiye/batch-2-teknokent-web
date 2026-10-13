import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { SectionHeader } from "@/components/mentee-home/section-header";
import { SectionPlaceholder } from "@/components/mentee-home/section-placeholder";
import type { HomeTask } from "@/lib/mentee-home";
import { DueTone, HomeTaskKind } from "@/types/mentee-home";

const TASK_LIMIT = 4;

const TONE_STYLES: Record<DueTone, { bar: string; chip: string; dot: string }> =
  {
    [DueTone.Overdue]: {
      bar: "bg-[#d23f3f]",
      chip: "bg-[#fbecec] text-[#99292b]",
      dot: "bg-[#d23f3f]",
    },
    [DueTone.Today]: {
      bar: "bg-[#e5701d]",
      chip: "bg-[#fdf3ec] text-[#c95c18]",
      dot: "bg-[#e5701d]",
    },
    [DueTone.Upcoming]: {
      bar: "bg-[#e86f22]",
      chip: "bg-[#fff7f1] text-[#e86f22]",
      dot: "bg-[#e86f22]",
    },
    [DueTone.None]: {
      bar: "bg-[#cdd6de]",
      chip: "bg-[#f3f4f6] text-[#676e78]",
      dot: "bg-[#a2aab4]",
    },
  };

const ACTION_CLASS =
  "inline-flex h-8 w-[116px] items-center justify-center rounded-3xl border border-[#ffe3d5] bg-white px-3 text-xs font-medium text-[#f97316] hover:bg-[#fff7f1]";

export function TaskList({
  tasks,
  loading,
  onDismiss,
  onOpenTask,
}: {
  tasks: HomeTask[];
  loading: boolean;
  onDismiss?: (taskId: string) => void;
  onOpenTask?: (task: HomeTask) => void;
}) {
  const t = useTranslations("menteeHome.tasks");
  return (
    <section aria-labelledby="home-tasks-title" className="flex flex-col gap-3">
      <SectionHeader id="home-tasks-title" title={t("title")} />
      <div className="rounded-[20px] border-[0.685px] border-[#e4e7ea] bg-white p-2">
        {tasks.slice(0, TASK_LIMIT).map((task) => {
          const tone = TONE_STYLES[task.dueTone];
          const reply = task.kind === HomeTaskKind.RequestReply;
          return (
            <div
              key={task.id}
              className="relative flex flex-wrap items-center gap-3.5 border-b-[0.685px] border-[#eef0f3] py-3.5 pl-4 pr-1 last:border-b-0 sm:flex-nowrap"
            >
              <span
                aria-hidden
                className={`absolute bottom-2 left-0 top-2 w-1 rounded-full ${tone.bar}`}
              />
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${reply ? "bg-[#fceeee]" : "bg-[#fff7f1]"}`}
              >
                <Image
                  src={`/mentee-dashboard/home/${reply ? "task-target" : "task-clipboard"}.svg`}
                  alt=""
                  width={18}
                  height={18}
                  className="size-[18px]"
                />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-medium leading-[21px] text-[#2b303a]">
                  {task.title}
                </strong>
                <small className="block truncate text-xs leading-[18px] text-[#7a828d]">
                  {task.subtitle}
                </small>
              </span>
              {task.dueLabel && (
                <span
                  className={`inline-flex min-w-[95px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium leading-[17.25px] ${tone.chip}`}
                >
                  <span className={`size-1.5 rounded-full ${tone.dot}`} />
                  {task.dueLabel}
                </span>
              )}
              {onOpenTask &&
              task.kind === HomeTaskKind.ActionItem &&
              task.requestId ? (
                <button
                  type="button"
                  onClick={() => onOpenTask(task)}
                  aria-label={`${task.actionLabel}: ${task.title}`}
                  className={ACTION_CLASS}
                >
                  {task.actionLabel}
                </button>
              ) : (
                <Link
                  href={task.href}
                  aria-label={`${task.actionLabel}: ${task.title}`}
                  className={ACTION_CLASS}
                >
                  {task.actionLabel}
                </Link>
              )}
              {onDismiss && (
                <button
                  type="button"
                  aria-label={t("dismiss", { title: task.title })}
                  onClick={() => onDismiss(task.id)}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-[#7a828d] hover:bg-[#f3f4f6] hover:text-[#2b303a]"
                >
                  <Image
                    src="/mentor-profile/close.svg"
                    alt=""
                    width={14}
                    height={14}
                    className="size-3.5"
                  />
                </button>
              )}
            </div>
          );
        })}
        {tasks.length === 0 && (
          <SectionPlaceholder
            loading={loading}
            emptyText={t("empty")}
            framed={false}
          />
        )}
      </div>
    </section>
  );
}
