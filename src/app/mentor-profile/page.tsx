"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { ListPagination } from "@/components/common/list-pagination";
import { AvailabilityDialog } from "@/components/mentor-profile/availability-dialog";
import { MentorAccent } from "@/components/mentorships/mentor-accent";
import { CvFileSection } from "@/components/profile/cv-file-section";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { useMentorCv } from "@/hooks/use-mentor-cv";
import {
  useMentorProfile,
  useMentorProfileForm,
} from "@/hooks/use-mentor-profile";
import { useMentorProfileOverview } from "@/hooks/use-mentor-profile-overview";
import { useOptionLabel } from "@/hooks/use-option-label";
import {
  MeetingFrequency,
  MentorLanguage,
  type MentorProfile,
  PrepFileRequirement,
} from "@/interfaces/mentor";
import type {
  LabelValue,
  MentorshipHistoryRow,
} from "@/lib/mentor-profile-overview";
import { MENTOR_PROFILE_HISTORY_PAGE_SIZE } from "@/lib/const/mentorships";
import { initials as toInitials } from "@/lib/utils";

type ProfileForm = ReturnType<typeof useMentorProfileForm>;
type TextField = Parameters<ProfileForm["updateField"]>[0];
type ChipTone = "blue" | "green" | "grey";

// globals.css gives buttons and form fields `font: inherit` outside any layer,
// so their type sizes need `!` to take effect.
const buttonTextClass = "text-[12.5px]! font-medium! leading-[19px]!";
const inputClass =
  "mt-1 block w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px]! text-[#22262b]";
const emptyClass = "text-xs text-[#858c96]";
const labelClass = "block text-[11.5px] text-[#676e78]";
const outlineButtonClass = `rounded-full border border-[#d4d8dd] bg-white px-4 py-2.5 text-[#4a5059] disabled:opacity-50 ${buttonTextClass}`;
const chipToneClass: Record<ChipTone, string> = {
  blue: "border-[#f5faff] bg-[#f2f8fc] text-[#26a4ff]",
  green: "border-[#cbebda] bg-[#eefaf3] text-[#0f7a4d]",
  grey: "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]",
};
const listItemClass =
  "flex flex-col gap-0.5 rounded-lg border border-[#e4e7ea] bg-white px-3 py-2.5";

function MentorshipHistoryList({
  history,
  isLoading,
}: {
  history: MentorshipHistoryRow[];
  isLoading: boolean;
}) {
  const t = useTranslations("mentorProfile");
  const pager = useClientPagination(history, MENTOR_PROFILE_HISTORY_PAGE_SIZE);

  if (isLoading) {
    return <p className={emptyClass}>{t("loading")}</p>;
  }
  if (history.length === 0) {
    return <p className={emptyClass}>{t("history.empty")}</p>;
  }

  return (
    <MentorAccent enabled>
      <ul className="flex flex-col gap-3">
        {pager.pageItems.map((row) => (
          <li key={row.id} className={listItemClass}>
            <p className="flex items-center justify-between gap-3 text-[13px] font-medium leading-5 text-[#22262b]">
              {row.title}
              {row.rating ? (
                <span
                  className="shrink-0 text-[12px] text-[#b7791f]"
                  aria-label={t("history.rating", { rating: row.rating })}
                >
                  ★ {row.rating}
                </span>
              ) : null}
            </p>
            <p className="text-[11.5px] leading-[18px] text-[#676e78]">
              {row.detail}
            </p>
          </li>
        ))}
      </ul>
      <ListPagination
        page={pager.page}
        totalPages={pager.totalPages}
        onPageChange={pager.setPage}
        label={t("history.pages")}
      />
    </MentorAccent>
  );
}

function Chip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-[5px] text-xs font-medium leading-[19px] ${chipToneClass[tone]}`}
    >
      {children}
    </span>
  );
}

function Card({
  title,
  onEdit,
  focusFirstField = false,
  children,
}: {
  title: string;
  onEdit?: () => void;
  focusFirstField?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("mentorProfile");
  const contentRef = useRef<HTMLDivElement>(null);

  // The Düzenle button that was pressed leaves the page in edit mode, so focus
  // moves to the section's first field instead of falling back to the body.
  useEffect(() => {
    if (!focusFirstField) return;
    contentRef.current
      ?.querySelector<HTMLElement>("input, textarea, select")
      ?.focus();
  }, [focusFirstField]);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[#e4e7ea] bg-white px-5 py-[18px]">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold leading-[23px] text-[#22262b]">
          {title}
        </h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={t("editSection", { title })}
            className={`text-[#26a4ff] ${buttonTextClass}`}
          >
            {t("edit")}
          </button>
        ) : null}
      </header>
      <div ref={contentRef} className="flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}

function Rows({ rows }: { rows: LabelValue[] }) {
  return (
    <dl className="flex flex-col gap-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-4 text-[12.5px] leading-[19px]"
        >
          <dt className="text-[#4a5059]">{row.label}</dt>
          <dd
            className={`text-right font-medium ${row.muted ? "text-[#858c96]" : "text-[#22262b]"}`}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TextInput({
  form,
  field,
  label,
  multiline = false,
}: {
  form: ProfileForm;
  field: TextField;
  label: string;
  multiline?: boolean;
}) {
  const value = form.form[field];
  return (
    <label className={labelClass}>
      {label}
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => form.updateField(field, event.target.value)}
          className={`${inputClass} min-h-24`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => form.updateField(field, event.target.value)}
          className={inputClass}
        />
      )}
    </label>
  );
}

function ChoiceInput<T extends string>({
  label,
  value,
  options,
  optionLabel,
  onChange,
}: {
  label: string;
  value: T | null;
  options: T[];
  optionLabel: (option: T) => string;
  onChange: (value: T) => void;
}) {
  const t = useTranslations("mentorProfile");
  return (
    <label className={labelClass}>
      {label}
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value as T)}
        className={inputClass}
      >
        {value === null ? (
          <option value="" disabled>
            {t("select")}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function MentorCvCard({ form }: { form: ProfileForm }) {
  const t = useTranslations("mentorProfile.cv");
  const cv = useMentorCv(form.applyCv);
  return (
    <Card title="CV">
      <CvFileSection
        cv={cv}
        accent="blue"
        whoSees={t("whoSees")}
        filledMessage={t("filled")}
      />
    </Card>
  );
}

function ProfileBody({ profile }: { profile: MentorProfile }) {
  const t = useTranslations("mentorProfile");
  const tOptions = useTranslations("options");
  const optionLabel = useOptionLabel();
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const form = useMentorProfileForm(profile);
  const overview = useMentorProfileOverview(profile);
  const [editedSection, setEditedSection] = useState<string | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const editing = form.isEditing;
  const editSection = (title: string) =>
    editing
      ? undefined
      : () => {
          setEditedSection(title);
          form.startEditing();
        };
  const focusSection = (title: string) => editing && editedSection === title;

  return (
    <>
      <main className="mx-auto flex w-full max-w-[1276px] flex-col gap-[22px] px-4 pb-[72px] pt-3 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-[18px]">
            <div className="grid size-[88px] shrink-0 place-items-center rounded-full bg-[#e6f1f8] text-[26px] font-semibold leading-10 text-[#26a4ff]">
              {profile.initials || toInitials(profile.fullName)}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="break-words text-[28px] font-semibold leading-[43px] text-[#22262b]">
                {profile.fullName}
              </h1>
              {overview.subtitle ? (
                <p className="text-[13.5px] leading-[21px] text-[#676e78]">
                  {overview.subtitle}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {overview.activePrograms.map((program) => (
                  <Chip key={program.id} tone="blue">
                    {program.name}
                  </Chip>
                ))}
                {profile.availabilityLabel ? (
                  <Chip tone="green">{profile.availabilityLabel}</Chip>
                ) : null}
                {overview.languages ? (
                  <Chip tone="grey">{overview.languages}</Chip>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setAvailabilityOpen(true)}
              className={outlineButtonClass}
            >
              {t("editAvailability")}
            </button>
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  form.cancelEditing();
                  primaryButtonRef.current?.focus();
                }}
                disabled={form.isSaving}
                className={outlineButtonClass}
              >
                {t("cancel")}
              </button>
            ) : null}
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={
                editing
                  ? () => void form.saveAndFinish()
                  : () => {
                      setEditedSection(null);
                      form.startEditing();
                    }
              }
              disabled={form.isSaving}
              className={`rounded-full bg-[#26a4ff] px-4 py-2.5 text-white disabled:bg-[#c9cdd2] ${buttonTextClass}`}
            >
              {!editing
                ? t("editProfile")
                : form.isSaving
                  ? t("saving")
                  : t("save")}
            </button>
          </div>
        </header>
        {form.saveError ? (
          <p role="alert" className="-mt-2 text-[12px] text-[#a65a15]">
            {form.saveError}
          </p>
        ) : null}

        <section
          aria-label={t("summary")}
          className="grid grid-cols-2 gap-6 rounded-xl border border-[#f5faff] px-0.5 py-[18px] sm:grid-cols-3 lg:grid-cols-5"
        >
          {overview.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex h-[90px] flex-col gap-[3px] rounded-[20px] border border-[#b9deff] px-6 py-3"
            >
              <p className="text-[11px] leading-[17px] text-[#858c96]">
                {stat.label}
              </p>
              <p className="text-lg font-semibold leading-7 text-[#22262b]">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex flex-col gap-[18px]">
            {editing ? <MentorCvCard form={form} /> : null}
            <Card
              title={t("about.title")}
              onEdit={editSection("about")}
              focusFirstField={focusSection("about")}
            >
              {editing ? (
                <>
                  <TextInput
                    form={form}
                    field="about"
                    label={t("about.title")}
                    multiline
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      form={form}
                      field="professionalTitle"
                      label={t("about.professionalTitle")}
                    />
                    <TextInput
                      form={form}
                      field="company"
                      label={t("about.company")}
                    />
                    <TextInput
                      form={form}
                      field="experienceLevel"
                      label={t("about.experience")}
                    />
                    <TextInput
                      form={form}
                      field="availabilityLabel"
                      label={t("about.availabilityLabel")}
                    />
                  </div>
                  <fieldset>
                    <legend className={labelClass}>
                      {t("about.languages")}
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                      {Object.values(MentorLanguage).map((language) => (
                        <label
                          key={language}
                          className="flex items-center gap-1.5 text-[12.5px] text-[#22262b]"
                        >
                          <input
                            type="checkbox"
                            checked={form.form.languages.includes(language)}
                            onChange={() => form.toggleLanguage(language)}
                            className="size-4 accent-[#26a4ff]"
                          />
                          {tOptions(`language.${language}`)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </>
              ) : (
                <p className="whitespace-pre-line text-[13px] leading-5 text-[#4a5059]">
                  {form.form.about || t("about.empty")}
                </p>
              )}
            </Card>

            <Card title={t("topics.title")}>
              <div className="flex flex-wrap gap-2">
                {form.form.specialties.length === 0 ? (
                  <p className={emptyClass}>{t("topics.empty")}</p>
                ) : (
                  form.form.specialties.map((topic) => (
                    <Chip key={topic} tone="blue">
                      {optionLabel("mentorTopic", topic)}
                      {editing ? (
                        <button
                          type="button"
                          onClick={() => form.removeSpecialty(topic)}
                          aria-label={t("topics.remove", {
                            topic: optionLabel("mentorTopic", topic),
                          })}
                        >
                          <X className="size-3" />
                        </button>
                      ) : null}
                    </Chip>
                  ))
                )}
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    aria-label={t("topics.new")}
                    value={form.specialtyInput}
                    onChange={(event) =>
                      form.setSpecialtyInput(event.target.value)
                    }
                    placeholder={t("topics.placeholder")}
                    className="min-w-0 flex-1 rounded-lg border border-[#d4d8dd] px-3 py-2 text-[12.5px]!"
                  />
                  <button
                    type="button"
                    onClick={form.addSpecialty}
                    className={`rounded-full border border-[#d4d8dd] px-3 py-2 text-[#26a4ff] ${buttonTextClass}`}
                  >
                    {t("topics.add")}
                  </button>
                </div>
              ) : null}
            </Card>

            <Card title={t("style.title")}>
              {editing ? (
                <>
                  <TextInput
                    form={form}
                    field="mentoringStyle"
                    label={t("style.field")}
                    multiline
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      form={form}
                      field="sectorExperience"
                      label={t("style.sector")}
                    />
                    <TextInput
                      form={form}
                      field="startupStages"
                      label={t("style.stages")}
                    />
                  </div>
                </>
              ) : overview.workingStyle.length === 0 ? (
                <p className={emptyClass}>{t("style.empty")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {overview.workingStyle.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2.5 text-[13px] leading-5 text-[#4a5059]"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full bg-[#26a4ff]"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {editing ? (
              <Card title={t("roles.title")}>
                {form.form.experiences.map((experience, index) => (
                  <fieldset
                    key={index}
                    className="grid gap-2 rounded-lg border border-[#e4e7ea] p-3 sm:grid-cols-2"
                  >
                    <legend className="sr-only">
                      {t("roles.legend", { number: index + 1 })}
                    </legend>
                    {(
                      [
                        ["title", t("roles.roleTitle")],
                        ["organization", t("roles.organization")],
                        ["period", t("roles.period")],
                        ["summary", t("roles.summary")],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field} className={labelClass}>
                        {label}
                        <input
                          value={experience[field]}
                          onChange={(event) =>
                            form.updateExperience(
                              index,
                              field,
                              event.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => form.removeExperience(index)}
                      className="justify-self-start text-xs text-[#a65a15]"
                    >
                      {t("roles.remove")}
                    </button>
                  </fieldset>
                ))}
                {form.canAddExperience ? (
                  <button
                    type="button"
                    onClick={form.addExperience}
                    className={`self-start rounded-full border border-[#d4d8dd] px-3 py-2 text-[#26a4ff] ${buttonTextClass}`}
                  >
                    {t("roles.add")}
                  </button>
                ) : null}
              </Card>
            ) : null}

            <Card title={t("history.title")}>
              <MentorshipHistoryList
                history={overview.history}
                isLoading={overview.isHistoryLoading}
              />
            </Card>
          </div>

          <aside className="flex flex-col gap-[18px]">
            <Card
              title={t("availability.title")}
              onEdit={() => setAvailabilityOpen(true)}
            >
              <p className="text-xs leading-[19px] text-[#676e78]">
                {t("availability.weekly")}
              </p>
              {overview.isAvailabilityLoading ? (
                <p className={emptyClass}>{t("loading")}</p>
              ) : overview.weeklyAvailability.length === 0 ? (
                <p className={emptyClass}>{t("availability.empty")}</p>
              ) : (
                <Rows rows={overview.weeklyAvailability} />
              )}
              {overview.capacityLabel ? (
                <div className="flex items-center justify-between rounded-lg border border-[#f5faff] bg-[#f2f8fc] px-3 py-2.5 leading-[19px]">
                  <span className="text-xs text-[#676e78]">
                    {t("availability.capacity")}
                  </span>
                  <span className="text-[12.5px] font-medium text-[#26a4ff]">
                    {overview.capacityLabel}
                  </span>
                </div>
              ) : null}
            </Card>

            <Card title={t("prefs.title")}>
              {editing ? (
                <>
                  <TextInput
                    form={form}
                    field="meetingMode"
                    label={t("prefs.format")}
                  />
                  <ChoiceInput
                    label={t("prefs.frequency")}
                    value={form.form.meetingFrequency}
                    options={Object.values(MeetingFrequency)}
                    optionLabel={(option) =>
                      tOptions(`meetingFrequency.${option}`)
                    }
                    onChange={form.setMeetingFrequency}
                  />
                  <ChoiceInput
                    label={t("prefs.prepFile")}
                    value={form.form.prepFileRequirement}
                    options={Object.values(PrepFileRequirement)}
                    optionLabel={(option) => tOptions(`prepFile.${option}`)}
                    onChange={form.setPrepFileRequirement}
                  />
                  <TextInput
                    form={form}
                    field="responseTimeLabel"
                    label={t("prefs.responseTime")}
                  />
                  <TextInput
                    form={form}
                    field="communicationPreference"
                    label={t("prefs.contact")}
                  />
                </>
              ) : overview.preferences.length === 0 ? (
                <p className={emptyClass}>{t("prefs.empty")}</p>
              ) : (
                <Rows rows={overview.preferences} />
              )}
            </Card>

            <Card title={t("programs.title")}>
              {overview.programs.length === 0 ? (
                <p className={emptyClass}>{t("programs.empty")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {overview.programs.map((program) => (
                    <li key={program.id} className={listItemClass}>
                      <p className="text-[13px] font-medium leading-5 text-[#22262b]">
                        {program.name}
                      </p>
                      {editing ? (
                        <label className={labelClass}>
                          {t("programs.role")}
                          <input
                            value={form.programRole(program.id)}
                            maxLength={80}
                            onChange={(event) =>
                              form.updateProgramRole(
                                program.id,
                                event.target.value,
                              )
                            }
                            placeholder={t("programs.rolePlaceholder")}
                            className={inputClass}
                          />
                        </label>
                      ) : (
                        <p className="text-[11.5px] leading-[18px] text-[#676e78]">
                          {program.detail}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      </main>
      {availabilityOpen ? (
        <AvailabilityDialog onClose={() => setAvailabilityOpen(false)} />
      ) : null}
    </>
  );
}

export default function MentorProfilePage() {
  const t = useTranslations("mentorProfile");
  const profileQuery = useMentorProfile();

  return (
    <AppShell mentorHome>
      {profileQuery.isLoading ? (
        <p className="p-10 text-center text-sm text-[#858c96]">
          {t("loading")}
        </p>
      ) : profileQuery.error || !profileQuery.data ? (
        <p className="p-10 text-center text-sm text-[#a65a15]">
          {t("loadFailed")}
        </p>
      ) : (
        <ProfileBody profile={profileQuery.data} />
      )}
    </AppShell>
  );
}
