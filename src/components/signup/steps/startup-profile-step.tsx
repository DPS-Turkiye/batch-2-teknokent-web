"use client";

import {
  OnboardingCard,
  OnboardingChips,
  OnboardingCounter,
  OnboardingField,
  OnboardingImagePicker,
  OnboardingListRow,
  OnboardingNote,
  OnboardingTextAction,
  onboardingInputClass,
} from "@/components/onboarding/onboarding-ui";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { useProgramNames } from "@/hooks/use-programs";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { useTeamMemberForm } from "@/hooks/use-team-member-form";
import {
  MAX_SUPPORT_AREAS,
  STARTUP_STAGE_OPTIONS,
  SUPPORT_AREA_OPTIONS,
  TAGLINE_MAX_LENGTH,
} from "@/interfaces/signup";
import { initials } from "@/lib/utils";
import { useOptionLabel } from "@/hooks/use-option-label";
import { useTranslations } from "next-intl";

const TONE = OnboardingTone.Mentee;
const theme = ONBOARDING_TONES[TONE];
const inputClass = `${onboardingInputClass} ${theme.focus}`;

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-[#fff4ec] text-[11px] font-semibold leading-[17px] text-[#9e4400]"
    >
      {initials(name) || "?"}
    </span>
  );
}

export function StartupProfileStep({ wizard }: { wizard: SignupWizard }) {
  const t = useTranslations();
  const copy = useTranslations("signupSteps");
  const optionLabel = useOptionLabel();
  // The no-program answer, sent as a null program id.
  const INDEPENDENT = copy("independent");
  const {
    draft,
    updateStartup,
    toggleSupportArea,
    addTeamMember,
    removeTeamMember,
  } = wizard;
  const { startup, personal } = draft;
  const programs = useProgramNames();
  const memberForm = useTeamMemberForm(addTeamMember);

  const programOptions = [
    ...(programs.data ?? []).map((program) => program.name),
    INDEPENDENT,
  ];
  const selectedProgram =
    startup.programId === null
      ? INDEPENDENT
      : (programs.data?.find((program) => program.id === startup.programId)
          ?.name ?? "");

  function chooseProgram(name: string) {
    const match = programs.data?.find((program) => program.name === name);
    updateStartup("programId", match ? match.id : null);
  }

  const founderName = `${personal.firstName} ${personal.lastName}`.trim();

  return (
    <>
      <OnboardingCard title={copy("basics")}>
        <div className="flex items-center gap-4">
          <OnboardingImagePicker
            label={copy("logo")}
            placeholder={copy("logoPlaceholder")}
            file={startup.logo}
            onChange={(file) => updateStartup("logo", file)}
          />
          <OnboardingField
            id="signup-startup-name"
            label={copy("startupName")}
            required
            tone={TONE}
          >
            <input
              id="signup-startup-name"
              className={inputClass}
              value={startup.name}
              onChange={(event) => updateStartup("name", event.target.value)}
            />
          </OnboardingField>
        </div>
        <OnboardingField
          id="signup-tagline"
          label={copy("oneLiner")}
          required
          tone={TONE}
        >
          <input
            id="signup-tagline"
            className={inputClass}
            maxLength={TAGLINE_MAX_LENGTH}
            value={startup.tagline}
            onChange={(event) => updateStartup("tagline", event.target.value)}
          />
        </OnboardingField>
        <OnboardingCounter
          hint={copy("oneLinerHint")}
          length={startup.tagline.length}
          max={TAGLINE_MAX_LENGTH}
        />
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <OnboardingField
            id="signup-website"
            label={copy("website")}
            tone={TONE}
          >
            <input
              id="signup-website"
              className={inputClass}
              placeholder={copy("websitePlaceholder")}
              value={startup.website}
              onChange={(event) => updateStartup("website", event.target.value)}
            />
          </OnboardingField>
          <OnboardingField
            id="signup-founded-year"
            label={copy("foundedYear")}
            tone={TONE}
          >
            <input
              id="signup-founded-year"
              className={inputClass}
              inputMode="numeric"
              maxLength={4}
              placeholder="2026"
              value={startup.foundedYear}
              onChange={(event) =>
                updateStartup(
                  "foundedYear",
                  event.target.value.replace(/\D/g, ""),
                )
              }
            />
          </OnboardingField>
        </div>
      </OnboardingCard>

      <OnboardingCard
        title={copy("programAndStage")}
        subtitle={copy("programAndStageSubtitle")}
      >
        <p className="text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
          {copy("program")}
        </p>
        {programs.isLoading ? (
          <p className="text-xs text-[#676e78]">{copy("programsLoading")}</p>
        ) : (
          <OnboardingChips
            tone={TONE}
            label={copy("program")}
            options={programOptions}
            selected={selectedProgram ? [selectedProgram] : []}
            onToggle={chooseProgram}
          />
        )}
        <p className="text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
          {copy("stage")}
        </p>
        <OnboardingChips
          tone={TONE}
          label={copy("stage")}
          options={STARTUP_STAGE_OPTIONS}
          selected={
            startup.maturity
              ? [startup.maturity as (typeof STARTUP_STAGE_OPTIONS)[number]]
              : []
          }
          onToggle={(stage) => updateStartup("maturity", stage)}
          labelFor={(stage) => optionLabel("stage", stage)}
        />
        {startup.maturity ? (
          <div className="flex flex-col gap-2 rounded-[10px] bg-[#f5faff] px-4 py-3.5">
            <p className="text-[10.5px] font-semibold uppercase leading-4 text-[#858c96]">
              {optionLabel("stage", startup.maturity)}
            </p>
            <p className="text-xs leading-[18px] text-[#4a5059]">
              {optionLabel("stageDescription", startup.maturity)}
            </p>
          </div>
        ) : null}
      </OnboardingCard>

      <OnboardingCard
        title={copy("team")}
        subtitle={copy("teamSubtitle")}
        action={
          memberForm.open ? null : (
            <OnboardingTextAction tone={TONE} onClick={memberForm.openForm}>
              {copy("addMember")}
            </OnboardingTextAction>
          )
        }
      >
        <OnboardingListRow actionLabel="">
          <Avatar name={founderName} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
              {founderName || "Sen"}
            </span>
            <span className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
              {[personal.role.trim(), "Kurucu"].filter(Boolean).join(" · ")}
            </span>
          </span>
        </OnboardingListRow>
        {startup.teamMembers.map((member, index) => (
          <OnboardingListRow
            key={`${member.fullName}-${index}`}
            actionLabel={copy("remove")}
            actionAriaLabel={copy("removeMember", { name: member.fullName })}
            onAction={() => removeTeamMember(index)}
          >
            <Avatar name={member.fullName} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
                {member.fullName}
              </span>
              <span className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                {[member.jobTitle, member.email].filter(Boolean).join(" · ") ||
                  "Rol belirtilmedi"}
              </span>
            </span>
          </OnboardingListRow>
        ))}
        {memberForm.open ? (
          <div className="flex flex-col gap-3 rounded-lg border border-[#e4e7ea] p-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <OnboardingField
                id="team-member-name"
                label={copy("memberName")}
                required
                tone={TONE}
              >
                <input
                  id="team-member-name"
                  className={inputClass}
                  value={memberForm.member.fullName}
                  onChange={(event) =>
                    memberForm.update("fullName", event.target.value)
                  }
                />
              </OnboardingField>
              <OnboardingField
                id="team-member-role"
                label={copy("memberRole")}
                tone={TONE}
              >
                <input
                  id="team-member-role"
                  className={inputClass}
                  value={memberForm.member.jobTitle}
                  onChange={(event) =>
                    memberForm.update("jobTitle", event.target.value)
                  }
                />
              </OnboardingField>
            </div>
            <OnboardingField
              id="team-member-email"
              label={t("auth.email")}
              tone={TONE}
            >
              <input
                id="team-member-email"
                type="email"
                className={inputClass}
                value={memberForm.member.email}
                onChange={(event) =>
                  memberForm.update("email", event.target.value)
                }
              />
            </OnboardingField>
            {memberForm.error ? (
              <p role="alert" className="text-xs text-[#b42318]">
                {memberForm.error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={memberForm.cancel}
                className="rounded-full px-4 py-2 text-[12.5px] font-medium text-[#4a5059] hover:bg-[#f8f9fa]"
              >
                {copy("cancel")}
              </button>
              <button
                type="button"
                onClick={memberForm.submit}
                className={`rounded-full px-4 py-2 text-[12.5px] font-medium text-white ${theme.bg} ${theme.bgHover}`}
              >
                {copy("add")}
              </button>
            </div>
          </div>
        ) : null}
      </OnboardingCard>

      <OnboardingCard
        title={copy("supportAreas")}
        subtitle={copy("supportAreasSubtitle", { max: MAX_SUPPORT_AREAS })}
      >
        <OnboardingChips
          tone={TONE}
          label={copy("supportAreas")}
          options={SUPPORT_AREA_OPTIONS}
          selected={
            startup.supportAreas as (typeof SUPPORT_AREA_OPTIONS)[number][]
          }
          onToggle={toggleSupportArea}
          labelFor={(area) => optionLabel("supportArea", area)}
        />
        {wizard.supportAreaLimitReached ? (
          <OnboardingNote>
            {copy("supportAreasLimit", { max: MAX_SUPPORT_AREAS })}
          </OnboardingNote>
        ) : null}
      </OnboardingCard>
    </>
  );
}
