"use client";

import Image from "next/image";

import {
  StartupPageFrame,
  startupPrimaryActionClass,
} from "@/components/startup/startup-page-frame";
import { useStartupProcess } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import {
  StartupStageState,
  type ProcessAssignment,
} from "@/interfaces/startup-process";
import {
  ASSIGNMENT_STATUS_CHIPS,
  assignmentSource,
  ChipTone,
  formatDueLabel,
  formatRoundRange,
  formatStageRange,
  STARTUP_STAGE_LABELS,
} from "@/lib/startup-process";

const cardClass =
  "space-y-3.5 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5";
const cardTitleClass =
  "text-[15px] font-semibold leading-[23px] text-[#22262b]";

const CHIP_TONES: Record<ChipTone, string> = {
  [ChipTone.Amber]: "border-[#f2ddbe] bg-[#fef6ec] text-[#a65a15]",
  [ChipTone.Gray]: "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]",
  [ChipTone.Green]: "border-[#cbebda] bg-[#eefaf3] text-[#0f7a4d]",
};

const STAGE_MARKERS: Record<StartupStageState, string> = {
  [StartupStageState.Completed]: "/startup/stage-completed.svg",
  [StartupStageState.Current]: "/startup/stage-current.svg",
  [StartupStageState.Upcoming]: "/startup/stage-upcoming.svg",
};

function AssignmentRow({
  assignment,
  source,
  isUploading,
  onUpload,
}: {
  assignment: ProcessAssignment;
  source: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  const chip = ASSIGNMENT_STATUS_CHIPS[assignment.status];
  const canUpload =
    assignment.status === ActionItemStatus.Open ||
    assignment.status === ActionItemStatus.InProgress;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e4e7ea] px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <Image src="/startup/done-ring.svg" alt="" width={17} height={17} />
        <div className="min-w-0 space-y-[3px]">
          <p className="text-[13.5px] font-medium leading-5 text-[#22262b]">
            {assignment.title}
          </p>
          {source ? (
            <p className="text-[11.5px] leading-[17px] text-[#676e78]">
              {source}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {assignment.dueDate ? (
          <span className="text-[11.5px] leading-[17px] text-[#858c96]">
            {formatDueLabel(assignment.dueDate)}
          </span>
        ) : null}
        <span
          className={`rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-[17px] ${CHIP_TONES[chip.tone]}`}
        >
          {chip.label}
        </span>
        {canUpload ? (
          <label
            className={`${startupPrimaryActionClass} cursor-pointer ${isUploading ? "opacity-60" : ""}`}
          >
            {isUploading ? "Yükleniyor…" : "Ödev yükle"}
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
        ) : null}
      </div>
    </li>
  );
}

export function StartupProcessView() {
  const process = useStartupProcess();

  if (process.isLoading) {
    return (
      <StartupPageFrame>
        <p className="py-10 text-sm text-[#858c96]">Süreç yükleniyor…</p>
      </StartupPageFrame>
    );
  }
  if (process.error) {
    return (
      <StartupPageFrame>
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {process.error.message}
        </p>
      </StartupPageFrame>
    );
  }

  const { currentRound, stages } = process;
  const currentIndex = stages.findIndex(
    (stage) => stage.state === StartupStageState.Current,
  );

  return (
    <StartupPageFrame>
      <div className="space-y-5">
        <section
          aria-label="Odak turu"
          className="space-y-3 rounded-[10px] bg-[#fff4ec] px-6 py-5"
        >
          {currentRound ? (
            <>
              <h2 className="text-xl leading-7 text-[#22262b]">
                {currentRound.title}
              </h2>
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
                    className={`text-xs leading-5 ${state === StartupStageState.Completed ? "text-[#858c96]" : "text-[#9e4400]"}`}
                  >
                    {STARTUP_STAGE_LABELS[stage]}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="startup-assignments" className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 id="startup-assignments" className={cardTitleClass}>
                Bu aşamadaki ödevlerin
              </h2>
              <p className="text-[12.5px] leading-[19px] text-[#676e78]">
                Her ödevin kimden geldiği ve neye bağlı olduğu satırda yazıyor.
              </p>
            </div>
            {currentRound ? (
              <button
                type="button"
                onClick={process.toggleShowAll}
                aria-pressed={process.showAll}
                className="shrink-0 text-[12.5px] font-medium leading-[19px] text-[#9e4400] hover:underline"
              >
                {process.showAll
                  ? "Bu tur →"
                  : `Tümü (${process.totalAssignments}) →`}
              </button>
            ) : null}
          </div>
          {process.assignments.length === 0 ? (
            <p className="text-sm text-[#858c96]">
              Bu tur için henüz ödev yok.
            </p>
          ) : (
            <ul className="space-y-3">
              {process.assignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  source={assignmentSource(
                    assignment,
                    process.roundName(assignment.roundId),
                  )}
                  isUploading={process.uploadingAssignmentId === assignment.id}
                  onUpload={(file) =>
                    process.uploadAssignment(assignment.id, file)
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="startup-completed-stages"
          className={cardClass}
        >
          <h2 id="startup-completed-stages" className={cardTitleClass}>
            Tamamlanan aşamalar
          </h2>
          {process.completedStages.length === 0 ? (
            <p className="text-sm text-[#858c96]">
              Henüz tamamlanan bir aşama yok.
            </p>
          ) : (
            <ul className="space-y-3">
              {process.completedStages.map((row) => (
                <li
                  key={row.stage}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e4e7ea] bg-[#f8f9fa] px-3.5 py-3"
                >
                  <span className="flex items-center gap-2.5 text-[13px] font-medium leading-5 text-[#4a5059]">
                    <Image
                      src="/startup/done-ring.svg"
                      alt=""
                      width={16}
                      height={16}
                    />
                    {STARTUP_STAGE_LABELS[row.stage]}
                  </span>
                  <span className="flex gap-5 text-xs leading-[18px] text-[#858c96]">
                    {row.startsOn && row.endsOn ? (
                      <span>{formatStageRange(row.startsOn, row.endsOn)}</span>
                    ) : null}
                    <span>{row.completedAssignments} ödev tamamlandı</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StartupPageFrame>
  );
}
