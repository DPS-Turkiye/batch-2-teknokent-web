"use client";

import { Check, Info, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { Button, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { StepPills } from "@/components/ia/step-pills";
import { InitialsAvatar, Tag, TagTone } from "@/components/student/iskur-ui";
import {
  PEER_MENTOR_WIZARD_STEPS,
  PeerMentorWizardStep,
  usePeerMentorPreviewPerson,
  usePeerMentorWizard,
} from "@/hooks/use-peer-mentor-give";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";

const CANCEL_HREF = "/student/peer-mentoring?as=MENTOR";

const STEP_KEY = {
  [PeerMentorWizardStep.Categories]: "categories",
  [PeerMentorWizardStep.Subtopics]: "subtopics",
  [PeerMentorWizardStep.Experience]: "experience",
  [PeerMentorWizardStep.HelpWith]: "helpWith",
  [PeerMentorWizardStep.Links]: "documents",
  [PeerMentorWizardStep.Availability]: "availability",
  [PeerMentorWizardStep.Preview]: "preview",
} as const;

/** The design's illustrations; categories without one show their name alone. */
const CATEGORY_ART: Partial<
  Record<PeerTopicCategory, { src: string; width: number; height: number }>
> = {
  [PeerTopicCategory.CareerInternship]: {
    src: "/ia/iskur/categories/career.png",
    width: 63,
    height: 63,
  },
  [PeerTopicCategory.TechnicalDigital]: {
    src: "/ia/iskur/categories/technical.png",
    width: 63,
    height: 63,
  },
  [PeerTopicCategory.AcademicDevelopment]: {
    src: "/ia/iskur/categories/academic.png",
    width: 63,
    height: 47,
  },
  [PeerTopicCategory.CampusLife]: {
    src: "/ia/iskur/categories/campus.png",
    width: 63,
    height: 61,
  },
};

const DOCUMENT_KINDS = ["transcript", "cv", "certificate", "other"] as const;
const HELP_TIPS = ["concrete", "who", "how", "noContact"] as const;
const LEVELS = ["basic", "intermediate", "advanced"] as const;

type Wizard = ReturnType<typeof usePeerMentorWizard>;

const fieldClass =
  "w-full rounded-input border border-border-control bg-background-surface px-4 py-3 type-body text-text-primary placeholder:text-text-placeholder focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-selected";

/**
 * The peer-mentor profile wizard: categories → sub-topics → experience → how you can help → documents and links →
 * weekly availability and capacity → preview → publish. Opens with the published answers when editing.
 */
export function PeerMentorProfileWizard() {
  const t = useTranslations("iaIskur.wizard");
  const wizard = usePeerMentorWizard();
  const { step } = wizard;
  const key = STEP_KEY[step];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="type-overline text-text-muted uppercase">
          {t("progress", {
            number: step + 1,
            total: PEER_MENTOR_WIZARD_STEPS.length,
          })}
        </p>
        <StepPills
          label={t("stepsLabel")}
          currentIndex={step}
          steps={PEER_MENTOR_WIZARD_STEPS.map((item) => ({
            key: STEP_KEY[item],
            label: t(`steps.${STEP_KEY[item]}`),
          }))}
        />
      </div>
      <QueryNotice isLoading={wizard.isLoading} error={wizard.loadError} />
      {wizard.isLoading || wizard.loadError ? null : (
        <form
          className="space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (wizard.isLast) wizard.publish();
            else wizard.next();
          }}
        >
          <fieldset
            disabled={wizard.isPublishing}
            className="min-w-0 space-y-6"
          >
            <legend className="sr-only">
              {wizard.existing ? t("editTitle") : t("title")}
            </legend>
            <header className="space-y-2">
              <h1 className="type-h1 text-text-primary">
                {t(`headings.${key}.title`)}
              </h1>
              <p className="type-body-lg text-text-secondary">
                {t(`headings.${key}.subtitle`)}
              </p>
            </header>
            {step === PeerMentorWizardStep.Categories ? (
              <CategoriesStep wizard={wizard} />
            ) : null}
            {step === PeerMentorWizardStep.Subtopics ? (
              <SubtopicsStep wizard={wizard} />
            ) : null}
            {step === PeerMentorWizardStep.Experience ? (
              <ExperienceStep wizard={wizard} />
            ) : null}
            {step === PeerMentorWizardStep.HelpWith ? (
              <HelpWithStep wizard={wizard} />
            ) : null}
            {step === PeerMentorWizardStep.Links ? (
              <DocumentsStep wizard={wizard} />
            ) : null}
            {step === PeerMentorWizardStep.Availability ? (
              <Card>
                <h2 className="mb-4 type-title-card text-text-primary">
                  {t("availability.title")}
                </h2>
                <WeeklyAvailabilityEditor
                  editor={wizard.availability}
                  showUnavailableDates={false}
                />
              </Card>
            ) : null}
            {step === PeerMentorWizardStep.Preview ? (
              <PreviewStep wizard={wizard} />
            ) : null}
            {wizard.error ? (
              <InlineAlert tone={StatusTone.Error} title={wizard.error} />
            ) : null}
            <InlineAlert tone={StatusTone.Success} title={t("badge.title")}>
              {t("badge.body")}
            </InlineAlert>
          </fieldset>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
            {wizard.isFirst ? (
              <Button href={CANCEL_HREF} variant={ButtonVariant.Ghost}>
                {t("back")}
              </Button>
            ) : (
              <Button
                variant={ButtonVariant.Ghost}
                onClick={wizard.back}
                disabled={wizard.isPublishing}
              >
                {t("back")}
              </Button>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
              {/* Saving a draft needs a backend draft endpoint (open with Arya). */}
              <Button
                variant={ButtonVariant.Ghost}
                disabled
                className="max-sm:hidden"
              >
                {t("saveDraft")}
              </Button>
              <span className="sr-only">{t("draftSoon")}</span>
              <Button type="submit" disabled={wizard.isPublishing}>
                {wizard.isPublishing
                  ? t("publishing")
                  : wizard.isLast
                    ? t("publish")
                    : t("next")}
              </Button>
            </div>
          </footer>
        </form>
      )}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 type-caption text-text-muted">
      <Info aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  );
}

function SoonBadge() {
  const t = useTranslations("iaIskur.wizard");
  return <StatusBadge tone={StatusTone.Neutral}>{t("soon")}</StatusBadge>;
}

function CategoriesStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("iaIskur.wizard");
  const topicLabel = useTranslations("peerTopics");
  if (wizard.categories.length === 0) {
    return (
      <InlineAlert tone={StatusTone.Info}>{t("noCategories")}</InlineAlert>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        {wizard.categories.map((item) => {
          const checked = wizard.draft.topics.includes(item.id);
          const art = CATEGORY_ART[item.id];
          return (
            <label
              key={item.id}
              className={`flex min-h-[100px] cursor-pointer items-center gap-3.5 rounded-2xl border bg-background-surface p-[18px] transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-selected ${
                checked
                  ? "border-brand-odtu-primary"
                  : "border-border-default hover:bg-background-subtle"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => wizard.toggleTopic(item.id)}
              />
              {art ? (
                <Image
                  src={art.src}
                  alt=""
                  width={art.width}
                  height={art.height}
                  className="shrink-0"
                />
              ) : null}
              <span className="min-w-0 flex-1 type-label text-text-primary">
                {topicLabel(item.id)}
              </span>
              {checked ? (
                <span
                  aria-hidden
                  className="grid size-[22px] shrink-0 place-items-center rounded-full bg-brand-odtu-primary"
                >
                  <Image
                    src="/ia/icons/check-inverse.svg"
                    alt=""
                    width={12}
                    height={12}
                  />
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <Note>{t("matchingNote")}</Note>
    </div>
  );
}

function SubtopicsStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("iaIskur.wizard");
  const topicLabel = useTranslations("peerTopics");
  const subtopicLabel = useTranslations("studentProfileCompletion.subtopics");
  if (wizard.subtopicGroups.length === 0) {
    return <InlineAlert tone={StatusTone.Info}>{t("noSubtopics")}</InlineAlert>;
  }
  return (
    <div className="space-y-6">
      {wizard.subtopicGroups.map((group) => (
        <Card key={group.id} className="space-y-4">
          <fieldset className="space-y-4">
            <legend className="flex w-full flex-wrap items-center justify-between gap-2">
              <span className="type-title-card text-text-primary">
                {topicLabel(group.id)}
              </span>
              <span className="type-caption text-text-muted">
                {t("subtopicCount", { count: group.selectedCount })}
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {group.subtopics.map((sub) => {
                const checked = wizard.draft.subtopics.includes(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 type-label has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-selected ${
                      checked
                        ? "border-brand-odtu-primary bg-background-selected text-text-accent"
                        : "border-border-default bg-background-surface text-text-primary hover:bg-background-subtle"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => wizard.toggleSubtopic(sub.id)}
                    />
                    {checked ? (
                      <Check aria-hidden className="size-3.5" />
                    ) : null}
                    {subtopicLabel(sub.labelKey)}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
          {/* A level per category needs a backend field (open with Arya); shown disabled until then. */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="type-caption text-text-secondary">
              {t("level.label")}
            </span>
            <span
              aria-disabled="true"
              className="inline-flex rounded-xl bg-background-muted p-1 opacity-60"
            >
              {LEVELS.map((level) => (
                <span
                  key={level}
                  className="rounded-full px-3.5 py-1.5 type-label text-text-secondary"
                >
                  {t(`level.${level}`)}
                </span>
              ))}
            </span>
            <SoonBadge />
          </div>
        </Card>
      ))}
      <Note>{t("subtopicsNote")}</Note>
    </div>
  );
}

function ExperienceStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("iaIskur.wizard.experience");
  return (
    <div className="space-y-4">
      <Card className="space-y-5">
        <h2 className="type-title-card text-text-primary">{t("title")}</h2>
        <TextArea
          label={t("strongCourses")}
          hint={t("onePerLine")}
          value={wizard.draft.strongCourses}
          onChange={(value) => wizard.setField("strongCourses", value)}
        />
        <TextArea
          label={t("projects")}
          hint={t("onePerLine")}
          value={wizard.draft.projects}
          onChange={(value) => wizard.setField("projects", value)}
        />
        <label className="block space-y-2">
          <span className="type-label text-text-primary">{t("erasmus")}</span>
          <input
            className={fieldClass}
            value={wizard.draft.erasmus}
            maxLength={500}
            onChange={(event) => wizard.setField("erasmus", event.target.value)}
          />
        </label>
      </Card>
      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
      {/* Experience cards (title, organisation, dates, evidence) need backend fields (open with Arya). */}
      <InlineAlert tone={StatusTone.Neutral}>{t("cardsSoon")}</InlineAlert>
    </div>
  );
}

function HelpWithStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("iaIskur.wizard.helpWith");
  return (
    <div className="space-y-6">
      <section
        aria-labelledby="help-tips-title"
        className="space-y-3 rounded-card border border-brand-odtu-primary bg-background-surface p-6"
      >
        <h2 id="help-tips-title" className="type-title-card text-text-primary">
          {t("tipsTitle")}
        </h2>
        <ul className="grid gap-x-8 gap-y-2 md:grid-cols-2">
          {HELP_TIPS.map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-2 type-body-sm text-text-secondary"
            >
              <Check
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-text-accent"
              />
              {t(`tips.${tip}`)}
            </li>
          ))}
        </ul>
      </section>
      <label className="block space-y-2">
        <span className="type-label text-text-primary">
          {t("label")}{" "}
          <span aria-hidden className="text-text-accent">
            *
          </span>
        </span>
        <textarea
          className={`${fieldClass} min-h-32`}
          value={wizard.draft.helpWith}
          maxLength={wizard.helpWithMax}
          aria-describedby="help-with-counter"
          onChange={(event) => wizard.setField("helpWith", event.target.value)}
        />
      </label>
      <p
        id="help-with-counter"
        className="flex items-center gap-1.5 type-caption text-text-muted"
      >
        <Info aria-hidden className="size-3.5" />
        {t("counter", {
          min: wizard.helpWithMin,
          length: wizard.helpWithLength,
          max: wizard.helpWithMax,
        })}
      </p>
    </div>
  );
}

function DocumentsStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("iaIskur.wizard.documents");
  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <h2 className="flex items-center gap-3 type-title-card text-text-primary">
          <span className="grid size-9 place-items-center rounded-xl bg-background-muted">
            <Link2 aria-hidden className="size-4" />
          </span>
          {t("linksTitle")}
        </h2>
        <label className="block space-y-2">
          <span className="type-label text-text-primary">{t("linkedin")}</span>
          <input
            className={fieldClass}
            inputMode="url"
            value={wizard.draft.linkedinUrl}
            placeholder={t("linkedinPlaceholder")}
            onChange={(event) =>
              wizard.setField("linkedinUrl", event.target.value)
            }
          />
        </label>
      </Card>
      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
      {/* Documents per category with "verification only / show on profile" need backend support (open with Arya). */}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="type-title-card text-text-primary">
            {t("soonTitle")}
          </h2>
          <SoonBadge />
        </div>
        <p className="type-body-sm text-text-secondary">{t("soonBody")}</p>
        <ul className="flex flex-wrap gap-2">
          {DOCUMENT_KINDS.map((kind) => (
            <li key={kind}>
              <Tag>{t(`kinds.${kind}`)}</Tag>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function PreviewStep({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("iaIskur.wizard.preview");
  const topicLabel = useTranslations("peerTopics");
  const subtopicLabel = useTranslations("studentProfileCompletion.subtopics");
  const dayLabel = useTranslations("options.weekday");
  const person = usePeerMentorPreviewPerson();
  const capacity = wizard.availabilitySettings.menteeCapacity;
  const linkedin = wizard.draft.linkedinUrl.trim();

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center gap-5">
          <InitialsAvatar initials={person.initials} size="lg" />
          <div className="space-y-2">
            <h2 className="type-h2 text-text-primary">{person.fullName}</h2>
            <p className="type-body text-text-secondary">
              {person.department}
              {person.department && person.classYear ? " · " : null}
              {person.classYear
                ? t("classYear", { classYear: person.classYear })
                : null}
            </p>
            <div className="flex flex-wrap gap-2">
              <Tag>{t("peer")}</Tag>
              <Tag tone={TagTone.Success}>{t("badgeVerified")}</Tag>
            </div>
          </div>
        </div>
        <hr className="border-border-subtle" />
        <div className="space-y-3">
          <h3 className="type-label text-text-primary">{t("topics")}</h3>
          <ul className="flex flex-wrap gap-2">
            {wizard.draft.topics.map((topic) => (
              <li key={topic}>
                <Tag tone={TagTone.Accent}>{topicLabel(topic)}</Tag>
              </li>
            ))}
            {wizard.previewSubtopics.map((sub) => (
              <li key={sub.id}>
                <Tag tone={TagTone.Accent}>{subtopicLabel(sub.labelKey)}</Tag>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="type-label text-text-primary">{t("helpWith")}</h3>
          <p className="type-body whitespace-pre-line text-text-secondary">
            {wizard.draft.helpWith.trim()}
          </p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="space-y-1">
            <dt className="type-caption text-text-muted">{t("hours")}</dt>
            <dd className="type-body-sm text-text-primary">
              {wizard.weeklyHours.length === 0 ? (
                t("noHours")
              ) : (
                <ul className="flex flex-wrap gap-x-2">
                  {wizard.weeklyHours.map((range) => (
                    <li key={`${range.dayOfWeek}-${range.start}`}>
                      {t("hoursRange", {
                        day: dayLabel(range.dayOfWeek),
                        start: range.start,
                        end: range.end,
                      })}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="type-caption text-text-muted">{t("capacity")}</dt>
            <dd className="type-body-sm text-text-primary">
              {capacity === null
                ? t("noCapacity")
                : t("capacityValue", { capacity })}
            </dd>
          </div>
        </dl>
      </Card>
      <Card className="space-y-3">
        <h2 className="type-title-card text-text-primary">{t("links")}</h2>
        {linkedin ? (
          <p className="flex items-center gap-3">
            <Link2 aria-hidden className="size-4 text-icon-default" />
            <span className="flex flex-col">
              <span className="type-label break-all text-text-primary">
                {linkedin}
              </span>
              <span className="type-caption text-text-muted">
                {t("linkShown")}
              </span>
            </span>
          </p>
        ) : (
          <p className="type-body-sm text-text-secondary">{t("noLinks")}</p>
        )}
      </Card>
    </div>
  );
}

function TextArea({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="block type-label text-text-primary">{label}</span>
      <span className="block type-caption text-text-muted">{hint}</span>
      <textarea
        className={`${fieldClass} min-h-28`}
        value={value}
        maxLength={2000}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
