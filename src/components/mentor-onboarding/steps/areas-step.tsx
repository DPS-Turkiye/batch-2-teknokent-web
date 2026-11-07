"use client";

import {
  OnboardingCard,
  OnboardingChips,
  OnboardingListRow,
  OnboardingTextAction,
  onboardingInputClass,
} from "@/components/onboarding/onboarding-ui";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { useInlineEntry } from "@/hooks/use-inline-entry";
import { StudentProfileCard } from "@/components/mentor-onboarding/steps/student-profile-card";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  MAX_MENTOR_TOPICS,
  MAX_OFFERINGS,
} from "@/interfaces/mentor-onboarding";
import { useOptionLabel } from "@/hooks/use-option-label";
import { useTranslations } from "next-intl";

const TONE = OnboardingTone.Mentor;
const theme = ONBOARDING_TONES[TONE];
const inputClass = `${onboardingInputClass} ${theme.focus}`;

export function MentorAreasStep({ wizard }: { wizard: MentorOnboarding }) {
  const copy = useTranslations("mentorSteps");
  const optionLabel = useOptionLabel();
  const { draft } = wizard;
  const entry = useInlineEntry(wizard.addOffering);

  const programNames = new Map(
    wizard.programs.map((program) => [program.id, program.name]),
  );

  return (
    <>
      <OnboardingCard
        rounded="rounded-xl"
        title={copy("programsTitle")}
        subtitle={copy("programsSubtitle")}
      >
        {wizard.programsLoading ? (
          <p className="text-xs text-[#676e78]">{copy("programsLoading")}</p>
        ) : wizard.programs.length ? (
          <OnboardingChips
            tone={TONE}
            label={copy("programsLabel")}
            options={wizard.programs.map((program) => program.id)}
            selected={draft.programIds}
            onToggle={wizard.toggleProgram}
            labelFor={(id) => programNames.get(id) ?? id}
          />
        ) : (
          <p className="text-xs text-[#858c96]">{copy("noPrograms")}</p>
        )}
      </OnboardingCard>

      <OnboardingCard
        rounded="rounded-xl"
        title={copy("topics")}
        subtitle={copy("topicsSubtitle", { max: MAX_MENTOR_TOPICS })}
      >
        <OnboardingChips
          tone={TONE}
          label={copy("topics")}
          options={wizard.topicOptions}
          selected={draft.topics}
          onToggle={wizard.toggleTopic}
          labelFor={(topic) => optionLabel("mentorTopic", topic)}
        />
        {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
        {wizard.studentMentor ? (
          <p className="text-xs text-[#676e78]">{copy("studentTopicsNote")}</p>
        ) : null}
        {draft.topics.length ? (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-[#e6f1f8] bg-[#f2f8fc] px-3 py-2.5 text-xs leading-[18px] text-[#0067b1]">
            <p className="font-medium">Seçilen: {draft.topics.join(", ")}</p>
            <p className="shrink-0">
              {draft.topics.length} / {MAX_MENTOR_TOPICS}
            </p>
          </div>
        ) : null}
      </OnboardingCard>

      {wizard.studentMentor ? (
        <StudentProfileCard
          student={wizard.draft.student}
          onChange={wizard.updateStudent}
        />
      ) : null}

      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
      <OnboardingCard
        rounded="rounded-xl"
        title={copy(
          wizard.studentMentor ? "studentLevelsTitle" : "stagesTitle",
        )}
        subtitle={copy(
          wizard.studentMentor ? "studentLevelsSubtitle" : "stagesSubtitle",
        )}
      >
        <OnboardingChips
          tone={TONE}
          label={copy(
            wizard.studentMentor ? "studentLevelsLabel" : "stagesLabel",
          )}
          options={wizard.stageOptions}
          selected={draft.stages}
          onToggle={wizard.toggleStage}
          labelFor={(stage) => optionLabel("stage", stage)}
        />
      </OnboardingCard>

      <OnboardingCard
        rounded="rounded-xl"
        title={copy("offeringsTitle")}
        subtitle={copy("offeringsSubtitle")}
        action={
          !entry.open && draft.offerings.length < MAX_OFFERINGS ? (
            <OnboardingTextAction tone={TONE} onClick={entry.openEntry}>
              {copy("addOffering")}
            </OnboardingTextAction>
          ) : null
        }
      >
        {draft.offerings.map((offering, index) => (
          <OnboardingListRow
            key={offering}
            actionLabel={copy("remove")}
            actionAriaLabel={copy("removeOffering", { offering: offering })}
            onAction={() => wizard.removeOffering(index)}
          >
            <span
              aria-hidden
              className={`size-1.5 shrink-0 rounded-full ${theme.bg}`}
            />
            <span className="truncate text-[13px] leading-5 text-[#22262b]">
              {offering}
            </span>
          </OnboardingListRow>
        ))}
        {entry.open ? (
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              entry.submit();
            }}
          >
            <input
              aria-label={copy("newOffering")}
              autoFocus
              className={inputClass}
              placeholder={copy("offeringPlaceholder")}
              value={entry.value}
              maxLength={255}
              onChange={(event) => entry.setValue(event.target.value)}
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={entry.cancel}
                className="rounded-full px-4 py-2 text-[12.5px] font-medium text-[#4a5059] hover:bg-[#f8f9fa]"
              >
                {copy("cancel")}
              </button>
              <button
                type="submit"
                className={`rounded-full px-4 py-2 text-[12.5px] font-medium text-white ${theme.bg} ${theme.bgHover}`}
              >
                {copy("add")}
              </button>
            </div>
          </form>
        ) : null}
        {!draft.offerings.length && !entry.open ? (
          <p className="text-xs text-[#858c96]">{copy("noOfferings")}</p>
        ) : null}
      </OnboardingCard>
    </>
  );
}
