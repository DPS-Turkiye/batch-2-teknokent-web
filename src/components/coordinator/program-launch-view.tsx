"use client";

import { Check, ChevronRight, Info, Plus, Upload, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { RuleStepper } from "@/components/coordinator/rule-stepper";
import { useProgramLaunch } from "@/hooks/use-program-launch";
import { LAUNCH_STEPS, LaunchStep, teamCodePrefix } from "@/lib/program-launch";
import { initials } from "@/lib/utils";

const FIELD =
  "mt-1.5 h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";
const CELL_FIELD =
  "h-10 w-full rounded-xl border border-transparent bg-transparent px-2 text-[13.5px] text-[#22262b] outline-none placeholder:text-[#aeb4bc] focus:border-[#e9ecef] focus:bg-white";

export function ProgramLaunchView() {
  const t = useTranslations("programLaunch");
  const launch = useProgramLaunch();
  const last = launch.stepIndex === LAUNCH_STEPS.length - 1;

  return (
    <div className="space-y-6">
      <nav
        aria-label={t("breadcrumb")}
        className="flex items-center gap-1.5 text-[13px] text-[#858c96]"
      >
        <Link href="/coordinator/programs">{t("myPrograms")}</Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span className="text-[#22262b]">{t("newProgram")}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-[28px] bg-[#f7f8f9] p-5 lg:self-start">
          <p className="mb-3 text-[12px] font-medium tracking-wide text-[#858c96] uppercase">
            {t("newProgram")}
          </p>
          <ol className="space-y-1">
            {LAUNCH_STEPS.map((item, index) => {
              const current = index === launch.stepIndex;
              const done = index < launch.stepIndex;
              return (
                <li
                  key={item}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
                    current
                      ? "bg-white shadow-[0_1px_2px_rgba(33,38,43,0.06)]"
                      : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] ${
                      current || done
                        ? "bg-[#22262b] text-white"
                        : "border border-[#e0e3e7] bg-white text-[#858c96]"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span>
                    <span
                      className={`block text-[14px] ${
                        current || done ? "text-[#22262b]" : "text-[#858c96]"
                      } ${current ? "font-medium" : ""}`}
                    >
                      {t(`steps.${item}.label`)}
                    </span>
                    <span className="block text-[12px] text-[#858c96]">
                      {t(`steps.${item}.hint`)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>

        <div className="min-w-0 space-y-5">
          <header>
            <p className="text-[13px] text-[#858c96]">
              {t("stepOf", {
                current: launch.stepIndex + 1,
                total: LAUNCH_STEPS.length,
              })}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-[#22262b]">
              {t(`steps.${launch.step}.title`)}
            </h1>
            <p className="mt-1 text-[13.5px] text-[#676e78]">
              {t(`steps.${launch.step}.note`)}
            </p>
          </header>

          <section className="rounded-[28px] border border-[#e9ecef] bg-white p-6">
            {launch.step === LaunchStep.Basics ? (
              <BasicsStep launch={launch} />
            ) : launch.step === LaunchStep.Rules ? (
              <RulesStep launch={launch} />
            ) : (
              <TeamsStep launch={launch} />
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {launch.stepIndex === 0 ? (
              <Link
                href="/coordinator/programs"
                className="px-5 py-[11px] text-[13.5px] text-[#22262b]"
              >
                {t("cancel")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={launch.back}
                className="px-5 py-[11px] text-[13.5px] text-[#22262b]"
              >
                {t("back")}
              </button>
            )}
            <div className="flex items-center gap-3">
              {launch.error ? (
                <p role="alert" className="text-[13px] text-[#d9464b]">
                  {launch.error}
                </p>
              ) : null}
              {last ? (
                <button
                  type="button"
                  onClick={launch.submit}
                  disabled={launch.creating}
                  className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
                >
                  {launch.creating ? t("creating") : t("create")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={launch.next}
                  className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white"
                >
                  {t("continue", {
                    step: t(
                      `steps.${LAUNCH_STEPS[launch.stepIndex + 1]}.label`,
                    ),
                  })}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Launch = ReturnType<typeof useProgramLaunch>;

function Label({
  htmlFor,
  optional,
  children,
}: {
  htmlFor?: string;
  optional?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-[#22262b]">
      {children}
      {optional ? (
        <span className="ml-1.5 text-[12px] font-normal text-[#858c96]">
          {optional}
        </span>
      ) : null}
    </label>
  );
}

function BasicsStep({ launch }: { launch: Launch }) {
  const t = useTranslations("programLaunch");
  const draft = launch.draft;
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="program-name">{t("name")}</Label>
        <input
          id="program-name"
          value={draft.name}
          onChange={(event) => launch.update({ name: event.target.value })}
          placeholder={t("namePlaceholder")}
          maxLength={255}
          className={FIELD}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="program-start">{t("start")}</Label>
          <input
            id="program-start"
            type="date"
            value={draft.startDate}
            onChange={(event) =>
              launch.update({ startDate: event.target.value })
            }
            className={FIELD}
          />
        </div>
        <div>
          <Label htmlFor="program-end">{t("end")}</Label>
          <input
            id="program-end"
            type="date"
            value={draft.endDate}
            onChange={(event) => launch.update({ endDate: event.target.value })}
            className={FIELD}
          />
        </div>
      </div>
      <div>
        <Label>{t("coordinators")}</Label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-2xl border border-[#e9ecef] px-3 py-2.5">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f4f5f7] py-1 pr-3 pl-1 text-[13px] text-[#22262b]">
            <span className="grid size-6 place-items-center rounded-full bg-[#ffe9dd] text-[10px] font-semibold text-[#c2562a]">
              {initials(launch.ownerName)}
            </span>
            {t("you", { name: launch.ownerName })}
          </span>
        </div>
        <p className="mt-1.5 text-[12.5px] text-[#858c96]">
          {t("coordinatorsHint")}
        </p>
      </div>
      <div>
        <Label htmlFor="program-description" optional={t("optional")}>
          {t("description")}
        </Label>
        <textarea
          id="program-description"
          value={draft.description}
          onChange={(event) =>
            launch.update({ description: event.target.value })
          }
          maxLength={2000}
          rows={3}
          className="mt-1.5 w-full rounded-2xl border border-[#e9ecef] px-4 py-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
        />
      </div>
    </div>
  );
}

function RulesStep({ launch }: { launch: Launch }) {
  const t = useTranslations("programRules");
  const rules = launch.draft.rules;
  return (
    <div className="divide-y divide-[#f0f2f4]">
      <div className="pb-4">
        <RuleStepper
          title={t("capacity")}
          hint={t("capacityHint")}
          value={rules.defaultMentorCapacity}
          unit={t("teams")}
          onChange={(delta) => launch.stepRule("defaultMentorCapacity", delta)}
        />
      </div>
      <div className="py-4">
        <RuleStepper
          title={t("meetingFrequency")}
          hint={t("meetingFrequencyHint")}
          value={rules.meetingFrequencyDays}
          onChange={(delta) => launch.stepRule("meetingFrequencyDays", delta)}
        />
      </div>
      <div className="py-4">
        <RuleStepper
          title={t("communicationGap")}
          hint={t("communicationGapHint")}
          value={rules.communicationGapDays}
          onChange={(delta) => launch.stepRule("communicationGapDays", delta)}
        />
      </div>
      <div className="pt-4">
        <RuleStepper
          title={t("bottleneck")}
          hint={t("bottleneckHint")}
          value={rules.bottleneckFlagDays}
          onChange={(delta) => launch.stepRule("bottleneckFlagDays", delta)}
        />
      </div>
    </div>
  );
}

function TeamsStep({ launch }: { launch: Launch }) {
  const t = useTranslations("programLaunch");
  const prefix = teamCodePrefix(launch.draft.name);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-semibold text-[#22262b]">
          {t("teamCount", { count: launch.teamCount })}
        </p>
        <div className="flex gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] text-[#22262b]">
            <Upload aria-hidden className="size-3.5" /> {t("importCsv")}
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void launch.importCsv(file);
                event.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={launch.addTeam}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5f7] px-4 py-2 text-[13px] text-[#22262b]"
          >
            <Plus aria-hidden className="size-3.5" /> {t("addRow")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[22px] border border-[#e9ecef]">
        <table className="w-full min-w-[640px] text-left text-[13.5px]">
          <thead className="text-[12.5px] text-[#858c96]">
            <tr className="border-b border-[#f0f2f4]">
              <th className="px-4 py-3 font-normal">{t("teamName")}</th>
              <th className="px-4 py-3 font-normal">{t("leadEmail")}</th>
              <th className="px-4 py-3 font-normal">{t("code")}</th>
              <th className="w-12 px-4 py-3">
                <span className="sr-only">{t("delete")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {launch.draft.teams.map((row, index) => {
              const problem = launch.problems.get(row.key);
              const filled = row.teamName.trim() || row.leadEmail.trim();
              return (
                <tr
                  key={row.key}
                  className={`border-b border-[#f0f2f4] last:border-0 ${
                    problem ? "bg-[#fff6f4]" : ""
                  }`}
                >
                  <td className="px-2 py-1.5">
                    <input
                      aria-label={t("teamNameRow", { n: index + 1 })}
                      value={row.teamName}
                      maxLength={255}
                      onChange={(event) =>
                        launch.updateTeam(row.key, {
                          teamName: event.target.value,
                        })
                      }
                      placeholder={t("teamName")}
                      className={CELL_FIELD}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={t("leadEmailRow", { n: index + 1 })}
                        type="email"
                        value={row.leadEmail}
                        maxLength={255}
                        onChange={(event) =>
                          launch.updateTeam(row.key, {
                            leadEmail: event.target.value,
                          })
                        }
                        placeholder={t("leadEmailPlaceholder")}
                        className={`${CELL_FIELD} ${problem ? "text-[#d9464b]" : ""}`}
                      />
                      {problem ? (
                        <span className="shrink-0 rounded-full bg-[#ffe9e6] px-2.5 py-1 text-[12px] text-[#d9464b]">
                          {t(`problems.${problem}`)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-1.5 font-semibold text-[#22262b]">
                    {filled && !problem ? `${prefix}-····` : "—"}
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      aria-label={t("deleteRow", { n: index + 1 })}
                      onClick={() => launch.removeTeam(row.key)}
                      className="grid size-8 place-items-center rounded-full text-[#858c96] hover:bg-[#f4f5f7]"
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="flex items-start gap-2 rounded-2xl bg-[#fff4ef] px-4 py-3 text-[13px] text-[#676e78]">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-[#ff6a3d]" />
        {t("codesNote")}
      </p>
    </div>
  );
}
