"use client";

import Image from "next/image";

import { useStartupProcess } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import {
  StartupStageState,
  type ProcessAssignment,
} from "@/interfaces/startup-process";
import { formatRoundRange, STARTUP_STAGE_LABELS } from "@/lib/startup-process";

// The Figma frame's placeholder beside "Ödevler"; kept as designed until the
// designer names this list (raised in the 2026-09-11 report).
const UNNAMED_LIST_TITLE = "xxxxxxxx";

const STAGE_MARKERS: Record<StartupStageState, string> = {
  [StartupStageState.Completed]: "/startup/stage-completed.svg",
  [StartupStageState.Current]: "/startup/stage-current.svg",
  [StartupStageState.Upcoming]: "/startup/stage-upcoming.svg",
};

function AssignmentRow({
  assignment,
  isUploading,
  onUpload,
}: {
  assignment: ProcessAssignment;
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  const done = assignment.status === ActionItemStatus.Completed;
  return (
    <li className="flex items-center gap-2.5 py-2.5">
      <Image
        src={done ? "/startup/dot-done.svg" : "/startup/dot-open.svg"}
        alt=""
        width={7}
        height={7}
      />
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div
          className={`min-w-0 space-y-2 leading-5 ${done ? "text-[#858c96] line-through" : ""}`}
        >
          <p className={`text-sm ${done ? "" : "text-[#22262b]"}`}>
            {STARTUP_STAGE_LABELS[assignment.stage]}
          </p>
          <p className={`text-xs ${done ? "" : "text-[#676e78]"}`}>
            {assignment.title}
          </p>
        </div>
        {done ? (
          <span className="shrink-0 rounded-xl bg-[#fff4ec] px-2.5 py-[5px] text-sm text-[#858c96]">
            Tamamlandı
          </span>
        ) : (
          <label
            className={`flex h-[30px] shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-[#fff4ec] px-2.5 text-sm text-[#e86f22] ${isUploading ? "opacity-60" : "hover:bg-[#fde6d4]"}`}
          >
            {isUploading ? "Yükleniyor…" : "Ödev Yükle"}
            <Image src="/startup/upload.svg" alt="" width={20} height={20} />
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.docx,.xlsx"
              disabled={isUploading}
              aria-label={`${assignment.title} için ödev yükle`}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onUpload(file);
              }}
            />
          </label>
        )}
      </div>
    </li>
  );
}

export function StartupProcessView() {
  const process = useStartupProcess();

  if (process.isLoading) {
    return <p className="py-10 text-sm text-[#858c96]">Süreç yükleniyor…</p>;
  }
  if (process.error) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {process.error.message}
      </p>
    );
  }

  const { currentRound, stages } = process;
  const currentIndex = stages.findIndex(
    (stage) => stage.state === StartupStageState.Current,
  );
  const roundLabel = currentRound?.name ?? "Tüm ödevler";

  const list = (title: string) => (
    <div className="min-w-0 space-y-5 px-6">
      <div className="flex items-center gap-5">
        <h2 className="text-base leading-6 text-[#22262b]">{title}</h2>
        <span className="text-xs text-[#e86f22]">{roundLabel}</span>
      </div>
      <div className="rounded-[24px] border border-[#e4e7ea] px-[22px] pb-2.5 pt-2">
        {process.assignments.length === 0 ? (
          <p className="py-4 text-sm text-[#858c96]">
            Bu tur için henüz ödev yok.
          </p>
        ) : (
          <ul className="divide-y divide-[#e6e6e6]">
            {process.assignments.map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                isUploading={process.uploadingAssignmentId === assignment.id}
                onUpload={(file) =>
                  process.uploadAssignment(assignment.id, file)
                }
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <section
        aria-label="Odak turu"
        className="space-y-3 rounded-[10px] bg-[#fff4ec] px-6 py-5"
      >
        {currentRound ? (
          <>
            <h1 className="text-xl leading-7 text-[#22262b]">
              {currentRound.title}
            </h1>
            <div className="flex items-center gap-3 text-[13px] font-medium text-[#22262b]">
              <span>{currentRound.name}</span>
              <span className="flex items-center gap-1">
                <Image
                  src="/startup/calendar-orange.svg"
                  alt=""
                  width={24}
                  height={24}
                />
                {formatRoundRange(currentRound.startsOn, currentRound.endsOn)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#676e78]">
            Henüz bir odak turu planlanmadı.
          </p>
        )}
      </section>

      <section
        aria-labelledby="startup-journey"
        className="space-y-4 rounded-[10px] bg-white px-6 py-[18px]"
      >
        <h2
          id="startup-journey"
          className="text-[15px] font-medium text-[#22262b]"
        >
          Startup süreci
        </h2>
        <div className="relative overflow-x-auto">
          {currentRound && currentIndex >= 0 ? (
            <Image
              src="/startup/focus-pointer.svg"
              alt=""
              width={199}
              height={79}
              className="pointer-events-none absolute -top-[92px] hidden -translate-x-1/2 md:block"
              style={{
                left: `${((currentIndex + 0.5) / stages.length) * 100}%`,
              }}
            />
          ) : null}
          <ol className="relative flex min-w-[560px]">
            <span
              aria-hidden
              className="absolute top-1.5 h-0.5 rounded-sm bg-[#fff4ec]"
              style={{
                left: `${50 / Math.max(stages.length, 1)}%`,
                right: `${50 / Math.max(stages.length, 1)}%`,
              }}
            />
            {stages.map(({ stage, state }) => (
              <li
                key={stage}
                aria-current={
                  state === StartupStageState.Current ? "step" : undefined
                }
                className="relative flex flex-1 flex-col items-center gap-1.5"
              >
                <Image
                  src={STAGE_MARKERS[state]}
                  alt=""
                  width={14}
                  height={14}
                />
                <span
                  className={`text-xs leading-5 ${state === StartupStageState.Completed ? "text-[#858c96]" : "text-[#e86f22]"}`}
                >
                  {STARTUP_STAGE_LABELS[stage]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {list(UNNAMED_LIST_TITLE)}
        {list("Ödevler")}
      </div>
    </div>
  );
}
