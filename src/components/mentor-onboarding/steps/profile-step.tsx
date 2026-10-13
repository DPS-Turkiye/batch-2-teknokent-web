"use client";

import { useRef } from "react";

import {
  OnboardingCard,
  OnboardingCounter,
  OnboardingField,
  OnboardingFileField,
  OnboardingImagePicker,
  OnboardingListRow,
  OnboardingTextAction,
  onboardingInputClass,
} from "@/components/onboarding/onboarding-ui";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  ABOUT_MAX_LENGTH,
  IntroPhase,
  MAX_EXPERIENCES,
} from "@/interfaces/mentor-onboarding";
import { DOCUMENT_MAX_BYTES } from "@/lib/const";
import { formatFileSize } from "@/lib/utils";
import { useTranslations } from "next-intl";

const TONE = OnboardingTone.Mentor;
const inputClass = `${onboardingInputClass} ${ONBOARDING_TONES[TONE].focus}`;

function UploadPhase({ wizard }: { wizard: MentorOnboarding }) {
  const copy = useTranslations("mentorSteps");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[20px] border border-[#e4e7ea] bg-white px-6 py-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-[#e4e7ea] py-3 hover:bg-[#f8f9fa]"
        >
          <span className="flex flex-col items-center gap-5">
            <span
              aria-hidden
              className="grid size-[84px] place-items-center rounded-[20px] bg-[#f5faff] text-[38px] font-medium text-[#26a4ff]"
            >
              ↑
            </span>
            <span className="text-sm font-semibold text-[#22262b]">
              {copy("uploadCv")}
            </span>
          </span>
          <span className="text-sm text-[#676e78]">{copy("uploadHint")}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          aria-label={copy("cvPick")}
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            event.target.value = "";
            if (!selected) return;
            if (selected.size > DOCUMENT_MAX_BYTES) return;
            void wizard.uploadCv({
              name: selected.name,
              size: selected.size,
              file: selected,
            });
          }}
        />
      </div>
      <button
        type="button"
        onClick={wizard.enterManually}
        className="self-start px-5 py-3 text-sm font-medium text-[#22262b] underline"
      >
        {copy("manual")}
      </button>
      {wizard.uploadError ? (
        <p role="alert" className="text-xs text-[#b42318]">
          {wizard.uploadError}
        </p>
      ) : null}
    </div>
  );
}

function ParsingPhase({ wizard }: { wizard: MentorOnboarding }) {
  const copy = useTranslations("mentorSteps");
  const cv = wizard.draft.cv;
  return (
    <section
      className="w-full max-w-[600px] rounded-[20px] border border-[#dee2e6] bg-white p-7"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-5">
        <span className="grid h-[59px] w-[54px] place-items-center rounded-[10px] bg-[#f5faff] text-sm font-semibold text-[#26a4ff]">
          CV
        </span>
        <div>
          <p className="text-base font-semibold text-[#22262b]">{cv?.name}</p>
          <p className="text-[13px] text-[#676e78]">
            {cv ? formatFileSize(cv.size) : ""}
          </p>
        </div>
      </div>
      <div className="mt-9 h-2.5 w-full overflow-hidden rounded-[10px] bg-[#edf0f2]">
        <div className="h-2.5 w-2/3 animate-pulse rounded-[10px] bg-[#26a4ff]" />
      </div>
      <p className="mt-5 text-sm text-[#676e78]">{copy("parsing")}</p>
      <p className="mt-4 text-[13px] text-[#676e78]">{copy("parsingHint")}</p>
    </section>
  );
}

function ExperienceEditor({
  wizard,
  index,
}: {
  wizard: MentorOnboarding;
  index: number;
}) {
  const copy = useTranslations("mentorSteps");
  const role = wizard.draft.profile.history[index];
  const set = (
    key: "title" | "organization" | "period" | "summary",
    value: string,
  ) => wizard.updateExperience(index, { ...role, [key]: value });
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#e4e7ea] p-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <OnboardingField
          id={`experience-title-${index}`}
          label={copy("role")}
          required
          tone={TONE}
        >
          <input
            id={`experience-title-${index}`}
            className={inputClass}
            value={role.title}
            onChange={(event) => set("title", event.target.value)}
          />
        </OnboardingField>
        <OnboardingField
          id={`experience-org-${index}`}
          label={copy("organization")}
          tone={TONE}
        >
          <input
            id={`experience-org-${index}`}
            className={inputClass}
            value={role.organization}
            onChange={(event) => set("organization", event.target.value)}
          />
        </OnboardingField>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <OnboardingField
          id={`experience-period-${index}`}
          label={copy("period")}
          tone={TONE}
        >
          <input
            id={`experience-period-${index}`}
            className={inputClass}
            placeholder={copy("periodPlaceholder")}
            value={role.period ?? ""}
            onChange={(event) => set("period", event.target.value)}
          />
        </OnboardingField>
        <OnboardingField
          id={`experience-summary-${index}`}
          label={copy("summary")}
          tone={TONE}
        >
          <input
            id={`experience-summary-${index}`}
            className={inputClass}
            value={role.summary ?? ""}
            onChange={(event) => set("summary", event.target.value)}
          />
        </OnboardingField>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => wizard.removeExperience(index)}
          className="rounded-full px-4 py-2 text-[12.5px] font-medium text-[#b42318] hover:bg-[#fef3f2]"
        >
          {copy("delete")}
        </button>
        <button
          type="button"
          onClick={() => wizard.setEditingExperience(null)}
          className="rounded-full bg-[#26a4ff] px-4 py-2 text-[12.5px] font-medium text-white hover:bg-[#1592ea]"
        >
          {copy("done")}
        </button>
      </div>
    </div>
  );
}

function FormPhase({ wizard }: { wizard: MentorOnboarding }) {
  const t = useTranslations();
  const copy = useTranslations("mentorSteps");
  const { draft, update, updateProfile } = wizard;
  const history = draft.profile.history;
  return (
    <>
      {wizard.parseNote ? (
        <p role="status" className="text-xs text-[#9e4400]">
          {wizard.parseNote}
        </p>
      ) : null}
      <OnboardingCard title={copy("basics")}>
        <div className="flex items-start gap-4">
          <OnboardingImagePicker
            label={copy("photo")}
            placeholder={copy("photoPlaceholder")}
            file={draft.photo}
            onChange={(file) => update("photo", file)}
            round
            size={72}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <OnboardingField
                id="mentor-first-name"
                label={t("auth.firstName")}
                required
                tone={TONE}
              >
                <input
                  id="mentor-first-name"
                  className={inputClass}
                  value={draft.firstName}
                  onChange={(event) => update("firstName", event.target.value)}
                />
              </OnboardingField>
              <OnboardingField
                id="mentor-last-name"
                label={t("auth.lastName")}
                required
                tone={TONE}
              >
                <input
                  id="mentor-last-name"
                  className={inputClass}
                  value={draft.lastName}
                  onChange={(event) => update("lastName", event.target.value)}
                />
              </OnboardingField>
            </div>
            <p className="max-w-[420px] text-[11.5px] leading-[17px] text-[#858c96]">
              {copy("photoNote")}
            </p>
          </div>
        </div>
        <OnboardingField
          id="mentor-title"
          label={copy("title")}
          required
          tone={TONE}
        >
          <input
            id="mentor-title"
            className={inputClass}
            placeholder={copy("titlePlaceholder")}
            value={draft.profile.title}
            onChange={(event) => updateProfile("title", event.target.value)}
          />
        </OnboardingField>
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <OnboardingField
            id="mentor-company"
            label={copy("organization")}
            tone={TONE}
          >
            <input
              id="mentor-company"
              className={inputClass}
              value={draft.profile.company}
              onChange={(event) => updateProfile("company", event.target.value)}
            />
          </OnboardingField>
          <OnboardingField
            id="mentor-experience"
            label={copy("experience")}
            required
            tone={TONE}
          >
            <input
              id="mentor-experience"
              className={inputClass}
              placeholder={copy("experiencePlaceholder")}
              value={draft.profile.totalExperience}
              onChange={(event) =>
                updateProfile("totalExperience", event.target.value)
              }
            />
          </OnboardingField>
        </div>
        <OnboardingField
          id="mentor-linkedin"
          label={copy("linkedin")}
          tone={TONE}
        >
          <input
            id="mentor-linkedin"
            className={inputClass}
            placeholder={copy("linkedinPlaceholder")}
            value={draft.linkedin}
            onChange={(event) => update("linkedin", event.target.value)}
          />
        </OnboardingField>
      </OnboardingCard>

      <OnboardingCard title={copy("cv")}>
        <OnboardingFileField
          label={copy("cvPick")}
          file={draft.cv}
          storedName={draft.cvStoredName}
          onChange={wizard.setCv}
          accept=".pdf,.docx"
        />
      </OnboardingCard>

      <OnboardingCard title={copy("about")} subtitle={copy("aboutSubtitle")}>
        <textarea
          aria-label={copy("about")}
          rows={3}
          maxLength={ABOUT_MAX_LENGTH}
          className={`${inputClass} min-h-24 resize-y py-3`}
          value={draft.about}
          onChange={(event) => update("about", event.target.value)}
        />
        <OnboardingCounter
          hint={copy("aboutHint")}
          length={draft.about.length}
          max={ABOUT_MAX_LENGTH}
        />
      </OnboardingCard>

      <OnboardingCard
        title={copy("experience")}
        subtitle={copy("experienceSubtitle", { max: MAX_EXPERIENCES })}
        action={
          history.length < MAX_EXPERIENCES ? (
            <OnboardingTextAction tone={TONE} onClick={wizard.addExperience}>
              {copy("addExperience")}
            </OnboardingTextAction>
          ) : null
        }
      >
        {history.map((role, index) =>
          wizard.editingExperience === index ? (
            <ExperienceEditor key={index} wizard={wizard} index={index} />
          ) : (
            <OnboardingListRow
              key={index}
              actionLabel={copy("edit")}
              actionAriaLabel={copy("editExperience", {
                title: role.title || copy("experience"),
              })}
              onAction={() => wizard.setEditingExperience(index)}
            >
              <span className="flex min-w-0 flex-col gap-[3px] py-0.5">
                <span className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
                  {[role.title, role.organization]
                    .filter(Boolean)
                    .join(" · ") || copy("newExperience")}
                </span>
                <span className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                  {[role.period, role.summary].filter(Boolean).join(" · ")}
                </span>
              </span>
            </OnboardingListRow>
          ),
        )}
      </OnboardingCard>
    </>
  );
}

export function MentorProfileStep({ wizard }: { wizard: MentorOnboarding }) {
  if (wizard.phase === IntroPhase.Parsing)
    return <ParsingPhase wizard={wizard} />;
  if (wizard.phase === IntroPhase.Upload)
    return <UploadPhase wizard={wizard} />;
  return <FormPhase wizard={wizard} />;
}
