"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { CoordinatorPicker } from "@/components/admin/coordinator-picker";
import { ProgramCurriculumSection } from "@/components/coordinator/program-curriculum-section";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import { ProgramPeerCategories } from "@/components/coordinator/program-peer-categories-section";
import { ProgramRosterSection } from "@/components/coordinator/program-roster-section";
import { ProgramTrainingEditor } from "@/components/coordinator/program-training-editor";
import { ProgramTypeChip } from "@/components/coordinator/program-type-chip";
import { RuleStepper } from "@/components/coordinator/rule-stepper";
import {
  useProgramArchive,
  useProgramCoordinators,
  useProgramSettings,
} from "@/hooks/use-coordinator-program";
import { useProgramNavigation } from "@/hooks/use-program-navigation";
import {
  ProgramLifecycle,
  type CoordinatorProgramDetail,
} from "@/interfaces/coordinator-program";
import { ProgramType } from "@/interfaces/program";
import { NO_COORDINATOR_CHOICES } from "@/lib/coordinator-picker";
import {
  ProgramTab,
  RULE_LIMITS,
  SettingsSection,
  settingsSections,
  stepDays,
} from "@/lib/coordinator-program-detail";

const FIELD =
  "mt-1.5 h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b] disabled:bg-[#f7f8f9]";

export function ProgramSettingsView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Settings}>
      {(detail) => (
        <SettingsBody
          key={detail.program.id}
          programId={programId}
          detail={detail}
        />
      )}
    </ProgramDetailFrame>
  );
}

function SettingsBody({
  programId,
  detail,
}: {
  programId: string;
  detail: CoordinatorProgramDetail;
}) {
  const t = useTranslations("programSettings");
  const tRule = useTranslations("programRules");
  const settings = useProgramSettings(programId, detail);
  const archived = detail.program.lifecycle === ProgramLifecycle.Completed;
  const draftProgram = detail.program.lifecycle === ProgramLifecycle.Draft;
  const navigation = useProgramNavigation(programId);
  // the admin views a program's settings; its coordinators change them
  const locked = archived || navigation.admin;
  const draft = settings.draft;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav
        aria-label={t("sectionsLabel")}
        className="lg:sticky lg:top-6 lg:self-start"
      >
        <ul className="space-y-1">
          {settingsSections(detail.program.type, detail.program.lifecycle).map(
            (section) => (
              <li key={section}>
                <a
                  href={`#${section.toLowerCase()}`}
                  onClick={() => settings.setSection(section)}
                  aria-current={
                    settings.section === section ? "true" : undefined
                  }
                  className={`block rounded-2xl px-4 py-2.5 text-[13.5px] ${
                    settings.section === section
                      ? "bg-[#f4f5f7] text-[#22262b]"
                      : "text-[#676e78]"
                  }`}
                >
                  {t(`sections.${section}`)}
                </a>
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="min-w-0 space-y-5">
        {archived ? (
          <p className="rounded-2xl bg-[#f4f5f7] px-5 py-3 text-[13px] text-[#676e78]">
            {t("archivedNote")}
          </p>
        ) : null}
        {navigation.admin ? (
          <p className="rounded-2xl bg-[#f4f5f7] px-5 py-3 text-[13px] text-[#676e78]">
            {t("adminViewNote")}
          </p>
        ) : null}

        <Section
          id={SettingsSection.General}
          title={t(`sections.${SettingsSection.General}`)}
        >
          <Row>
            <p className="flex items-center gap-2 text-[12.5px] font-medium text-[#676e78]">
              {t("type")}
              <ProgramTypeChip type={detail.program.type} />
            </p>
          </Row>
          <Row>
            <label className="block text-[12.5px] font-medium text-[#676e78]">
              {t("name")}
              <input
                value={draft.name}
                maxLength={255}
                disabled={locked}
                onChange={(event) =>
                  settings.update({ name: event.target.value })
                }
                className={FIELD}
              />
            </label>
          </Row>
          <Row>
            <label className="block text-[12.5px] font-medium text-[#676e78]">
              {t("description")}
              <textarea
                value={draft.description ?? ""}
                maxLength={2000}
                rows={3}
                disabled={locked}
                onChange={(event) =>
                  settings.update({ description: event.target.value })
                }
                className={`${FIELD} h-auto py-3`}
              />
            </label>
          </Row>
          <Row>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[12.5px] font-medium text-[#676e78]">
                {t("start")}
                <input
                  type="date"
                  value={draft.startDate ?? ""}
                  disabled={locked}
                  onChange={(event) =>
                    settings.update({ startDate: event.target.value || null })
                  }
                  className={FIELD}
                />
              </label>
              <label className="block text-[12.5px] font-medium text-[#676e78]">
                {t("end")}
                <input
                  type="date"
                  value={draft.endDate ?? ""}
                  disabled={locked}
                  onChange={(event) =>
                    settings.update({ endDate: event.target.value || null })
                  }
                  className={FIELD}
                />
              </label>
            </div>
          </Row>
        </Section>

        <ProgramCurriculumSection
          programId={programId}
          detail={detail}
          archived={locked}
        />

        <CoordinatorsSection
          programId={programId}
          detail={detail}
          editable={navigation.admin ? !archived : false}
        />

        {detail.program.type === ProgramType.PeerMentoring ? (
          <Section
            id={SettingsSection.Training}
            title={t(`sections.${SettingsSection.Training}`)}
            note={t("trainingNote")}
          >
            {/* Admins and the program's coordinators both edit it (D10), so the admin view lock does not apply. */}
            <ProgramTrainingEditor programId={programId} archived={archived} />
          </Section>
        ) : null}

        <Section
          id={SettingsSection.Rules}
          title={t(`sections.${SettingsSection.Rules}`)}
          note={t("rulesNote")}
        >
          <Row>
            <RuleStepper
              title={tRule("meetingFrequency")}
              hint={tRule("meetingFrequencyHint")}
              value={draft.meetingFrequencyDays}
              disabled={locked}
              onChange={(delta) =>
                settings.update({
                  meetingFrequencyDays: stepDays(
                    draft.meetingFrequencyDays,
                    delta,
                    RULE_LIMITS.meetingFrequencyDays,
                  ),
                })
              }
            />
          </Row>
          <Row>
            <RuleStepper
              title={tRule("stale")}
              hint={tRule("staleHint")}
              value={draft.staleAfterDays}
              disabled={locked}
              onChange={(delta) =>
                settings.update({
                  staleAfterDays: stepDays(
                    draft.staleAfterDays,
                    delta,
                    RULE_LIMITS.staleAfterDays,
                  ),
                })
              }
            />
          </Row>
          <Row>
            <RuleStepper
              title={tRule("communicationGap")}
              hint={tRule("communicationGapHint")}
              value={draft.communicationGapDays}
              disabled={locked}
              onChange={(delta) =>
                settings.update({
                  communicationGapDays: stepDays(
                    draft.communicationGapDays,
                    delta,
                    RULE_LIMITS.communicationGapDays,
                  ),
                })
              }
            />
          </Row>
          <Row>
            <RuleStepper
              title={tRule("bottleneck")}
              hint={tRule("bottleneckHint")}
              value={draft.bottleneckFlagDays}
              disabled={locked}
              onChange={(delta) =>
                settings.update({
                  bottleneckFlagDays: stepDays(
                    draft.bottleneckFlagDays,
                    delta,
                    RULE_LIMITS.bottleneckFlagDays,
                  ),
                })
              }
            />
          </Row>
          <Row>
            <RuleStepper
              title={tRule("capacity")}
              hint={tRule("capacityHint")}
              value={draft.defaultMentorCapacity}
              unit={tRule("teams")}
              disabled={locked}
              onChange={(delta) =>
                settings.update({
                  defaultMentorCapacity: stepDays(
                    draft.defaultMentorCapacity,
                    delta,
                    RULE_LIMITS.defaultMentorCapacity,
                  ),
                })
              }
            />
          </Row>
          <Row>
            <Toggle
              title={tRule("noteRequired")}
              hint={tRule("noteRequiredHint")}
              checked={draft.meetingNoteRequired}
              disabled={locked}
              onChange={(value) =>
                settings.update({ meetingNoteRequired: value })
              }
            />
          </Row>
          <Row>
            <Toggle
              title={tRule("autoMatch")}
              hint={tRule("autoMatchHint")}
              checked={draft.autoMatchSuggestions}
              disabled={locked}
              onChange={(value) =>
                settings.update({ autoMatchSuggestions: value })
              }
            />
          </Row>
        </Section>

        {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
        <Section
          id={SettingsSection.Eligibility}
          title={t(`sections.${SettingsSection.Eligibility}`)}
          note={t("eligibilityNote")}
        >
          <Row>
            <label className="block text-[12.5px] font-medium text-[#676e78]">
              {t("eligibleDomain")}
              <input
                value={draft.eligibleEmailDomain ?? ""}
                maxLength={255}
                disabled={locked}
                placeholder="metu.edu.tr"
                onChange={(event) =>
                  settings.update({ eligibleEmailDomain: event.target.value })
                }
                className={FIELD}
              />
            </label>
            <p className="mt-1.5 text-[12.5px] text-[#858c96]">
              {t("eligibleDomainHint")}
            </p>
          </Row>
          <Row>
            <Toggle
              title={t("rosterOnly")}
              hint={t("rosterOnlyHint")}
              checked={draft.rosterOnly}
              disabled={locked}
              onChange={(value) => settings.update({ rosterOnly: value })}
            />
          </Row>
          {draft.rosterOnly ? (
            <Row>
              <ProgramRosterSection programId={programId} archived={locked} />
            </Row>
          ) : null}
          <Row>
            <Toggle
              title={t("individualMentees")}
              hint={t("individualMenteesHint")}
              checked={draft.individualMentees}
              disabled={locked}
              onChange={(value) =>
                settings.update({ individualMentees: value })
              }
            />
          </Row>
        </Section>

        {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
        {detail.program.type === ProgramType.PeerMentoring ? (
          <Section
            id={SettingsSection.PeerCategories}
            title={t(`sections.${SettingsSection.PeerCategories}`)}
            note={t("peerCategoriesNote")}
          >
            <Row>
              <ProgramPeerCategories programId={programId} readOnly={locked} />
            </Row>
          </Section>
        ) : null}

        {draftProgram ? null : (
          <ArchiveSection
            programId={programId}
            archived={archived}
            readOnly={navigation.admin}
          />
        )}

        {settings.error ? (
          <p role="alert" className="text-[13px] text-[#d9464b]">
            {settings.error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={settings.cancel}
            disabled={!settings.dirty || settings.saving}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={settings.save}
            disabled={locked || !settings.dirty || settings.saving}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {settings.saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The admin assigns and changes coordinators; coordinators see the list only. */
function CoordinatorsSection({
  programId,
  detail,
  editable,
}: {
  programId: string;
  detail: CoordinatorProgramDetail;
  editable: boolean;
}) {
  const t = useTranslations("programSettings");
  const team = useProgramCoordinators(programId, detail.coordinators);
  return (
    <Section
      id={SettingsSection.Coordinators}
      title={t(`sections.${SettingsSection.Coordinators}`)}
      note={t("coordinatorsNote")}
    >
      <ul aria-label={t("coordinatorsList")}>
        {team.coordinators.map((coordinator) => (
          <li key={coordinator.id}>
            <Row>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] text-[#22262b]">
                  {coordinator.fullName}
                  {coordinator.owner ? (
                    <span className="ml-2 rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[11.5px] text-[#676e78]">
                      {t("owner")}
                    </span>
                  ) : null}
                </span>
                {editable && !coordinator.owner ? (
                  <button
                    type="button"
                    disabled={team.busy}
                    onClick={() => team.remove(coordinator.id)}
                    aria-label={t("removeLabel", {
                      name: coordinator.fullName,
                    })}
                    className="rounded-full border border-[#e9ecef] px-3 py-1.5 text-[12.5px] text-[#d9464b] disabled:text-[#aeb4bc]"
                  >
                    {t("remove")}
                  </button>
                ) : null}
              </div>
            </Row>
          </li>
        ))}
      </ul>
      <Row>
        {!editable ? (
          <p className="text-[13px] text-[#858c96]">
            {t("coordinatorsByAdmin")}
          </p>
        ) : team.picking ? (
          <div className="space-y-2">
            {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
            <CoordinatorPicker
              chosen={NO_COORDINATOR_CHOICES}
              onChange={team.pick}
              programId={programId}
              disabled={team.busy}
            />
            <button
              type="button"
              onClick={team.closePicker}
              className="text-[12.5px] text-[#676e78]"
            >
              {t("cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={team.openPicker}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] text-[#22262b] disabled:text-[#aeb4bc]"
          >
            <Plus aria-hidden className="size-4" /> {t("addCoordinator")}
          </button>
        )}
      </Row>
    </Section>
  );
}

function ArchiveSection({
  programId,
  archived,
  readOnly,
}: {
  programId: string;
  archived: boolean;
  readOnly: boolean;
}) {
  const t = useTranslations("programSettings");
  const archive = useProgramArchive(programId, archived);
  return (
    <section
      id={SettingsSection.Archive.toLowerCase()}
      aria-labelledby="archive-title"
      className="rounded-[28px] border border-[#f5c9ca] bg-white"
    >
      <h2
        id="archive-title"
        className="border-b border-[#f7e3e3] px-6 py-5 text-[16px] font-semibold text-[#22262b]"
      >
        {t("danger")}
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <span>
          <span className="block text-[13.5px] text-[#22262b]">
            {archived ? t("reopenTitle") : t("archiveTitle")}
          </span>
          <span className="block text-[12.5px] text-[#858c96]">
            {archived ? t("reopenHint") : t("archiveHint")}
          </span>
        </span>
        {archived ? (
          <button
            type="button"
            disabled={readOnly || archive.busy}
            onClick={archive.restore}
            className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {t("reopen")}
          </button>
        ) : archive.confirming ? (
          <span className="flex items-center gap-2">
            <span className="text-[12.5px] text-[#d9464b]">{t("sure")}</span>
            <button
              type="button"
              onClick={archive.cancel}
              className="rounded-full border border-[#e9ecef] px-3 py-1.5 text-[12.5px]"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={archive.busy}
              onClick={archive.archive}
              className="rounded-full bg-[#d9464b] px-3 py-1.5 text-[12.5px] font-medium text-white"
            >
              {t("confirmArchive")}
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={readOnly}
            onClick={archive.ask}
            className="rounded-full bg-[#fdeeee] px-4 py-2 text-[13px] font-medium text-[#d9464b] disabled:opacity-50"
          >
            {t("archive")}
          </button>
        )}
      </div>
    </section>
  );
}

function Section({
  id,
  title,
  note,
  children,
}: {
  id: SettingsSection;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id.toLowerCase()}
      aria-labelledby={`${id}-title`}
      className="rounded-[28px] border border-[#e9ecef] bg-white"
    >
      <div className="border-b border-[#f0f2f4] px-6 py-5">
        <h2
          id={`${id}-title`}
          className="text-[16px] font-semibold text-[#22262b]"
        >
          {title}
        </h2>
        {note ? (
          <p className="mt-1 text-[12.5px] text-[#858c96]">{note}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-[#f0f2f4] px-6 py-4 last:border-0">
      {children}
    </div>
  );
}

function Toggle({
  title,
  hint,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-[13.5px] text-[#22262b]">{title}</span>
        <span className="block text-[12.5px] text-[#858c96]">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-[#e0e3e7] transition peer-checked:bg-[#22262b] peer-disabled:opacity-50 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
      />
    </label>
  );
}
