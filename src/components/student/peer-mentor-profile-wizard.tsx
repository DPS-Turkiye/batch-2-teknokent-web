"use client";

import { Check, Info, Link2, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { StepPills } from "@/components/ia/step-pills";
import {
  CATEGORY_ART,
  InitialsAvatar,
  Tag,
  TagTone,
} from "@/components/student/iskur-ui";
import {
  PEER_MENTOR_WIZARD_STEPS,
  PeerMentorWizardStep,
  usePeerMentorPreviewPerson,
  usePeerMentorWizard,
} from "@/hooks/use-peer-mentor-give";
import { PEER_TOPIC_LEVELS, PeerTopicLevel } from "@/interfaces/peer-mentoring";
import {
  formatYearMonth,
  PEER_EXPERIENCE_SUMMARY_MAX,
  PEER_EXPERIENCE_TITLE_MAX,
} from "@/lib/peer-mentoring";
import { formatTime } from "@/lib/utils";
import type { ExperienceCardForm } from "@/types/iskur-student";

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

const DOCUMENT_KINDS = ["transcript", "cv", "certificate", "other"] as const;
const HELP_TIPS = ["concrete", "who", "how", "noContact"] as const;
const LEVEL_KEY = {
  [PeerTopicLevel.Basic]: "basic",
  [PeerTopicLevel.Intermediate]: "intermediate",
  [PeerTopicLevel.Advanced]: "advanced",
} as const satisfies Record<PeerTopicLevel, string>;

type Wizard = ReturnType<typeof usePeerMentorWizard>;

const fieldClass =
  "w-full rounded-input border border-border-control bg-background-surface px-4 py-3 type-body text-text-primary placeholder:text-text-placeholder focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-selected";

/**
 * The peer-mentor profile wizard: categories → sub-topics → experience → how you can help → documents and links →
 * weekly availability and capacity → preview → publish. Opens with the published answers when editing.
 */
export function PeerMentorProfileWizard() {
  const t = useTranslations("iaIskur.wizard");
  const locale = useLocale();
  const wizard = usePeerMentorWizard();
  const { step } = wizard;
  const key = STEP_KEY[step];
  const draftBusy =
    wizard.isPublishing || wizard.isSavingDraft || wizard.isDiscardingDraft;

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
            <BadgeNote />
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
              {wizard.draftSavedAt ? (
                <>
                  <span className="type-caption text-text-muted">
                    {t("draftSavedAt", {
                      time: formatTime(wizard.draftSavedAt, locale),
                    })}
                  </span>
                  {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
                  <Button
                    variant={ButtonVariant.Ghost}
                    onClick={wizard.discardDraft}
                    disabled={draftBusy}
                  >
                    {t("discardDraft")}
                  </Button>
                </>
              ) : null}
              <Button
                variant={ButtonVariant.Secondary}
                onClick={wizard.saveDraft}
                disabled={draftBusy}
              >
                {wizard.isSavingDraft ? t("savingDraft") : t("saveDraft")}
              </Button>
              <Button type="submit" disabled={draftBusy}>
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

function BadgeNote() {
  const t = useTranslations("iaIskur.wizard.badge");
  const person = usePeerMentorPreviewPerson();
  if (!person.badgeVerified) return null;
  return (
    <InlineAlert tone={StatusTone.Success} title={t("title")}>
      {t("body")}
    </InlineAlert>
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
        {wizard.categoryOptions.map(({ id, checked }) => {
          const art = CATEGORY_ART[id];
          return (
            <label
              key={id}
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
                onChange={() => wizard.toggleTopic(id)}
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
                {topicLabel(id)}
              </span>
              {checked ? (
                <span
                  aria-hidden
                  className="grid size-[22px] shrink-0 place-items-center rounded-full bg-brand-odtu-primary text-text-inverse"
                >
                  <Check className="size-3" />
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
              {group.subtopics.map(({ checked, ...sub }) => {
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
          <fieldset className="flex flex-wrap items-center gap-3">
            <legend className="float-left mr-3 type-caption text-text-secondary">
              {t("level.label")}
              <span className="sr-only">, {topicLabel(group.id)}</span>
            </legend>
            <span className="inline-flex rounded-xl bg-background-muted p-1">
              {PEER_TOPIC_LEVELS.map((level) => {
                const chosen = wizard.levelOf(group.id) === level;
                return (
                  <label
                    key={level}
                    className={`cursor-pointer rounded-full px-3.5 py-1.5 type-label has-focus-visible:outline-2 has-focus-visible:outline-border-selected ${
                      chosen
                        ? "bg-background-surface text-text-accent shadow-raised"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`level-${group.id}`}
                      className="sr-only"
                      checked={chosen}
                      onChange={() => wizard.setLevel(group.id, level)}
                    />
                    {t(`level.${LEVEL_KEY[level]}`)}
                  </label>
                );
              })}
            </span>
          </fieldset>
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
          maxLength={wizard.textMax}
          value={wizard.draft.strongCourses}
          onChange={(value) => wizard.setField("strongCourses", value)}
        />
        <TextArea
          label={t("projects")}
          hint={t("onePerLine")}
          maxLength={wizard.textMax}
          value={wizard.draft.projects}
          onChange={(value) => wizard.setField("projects", value)}
        />
        <label className="block space-y-2">
          <span className="type-label text-text-primary">{t("erasmus")}</span>
          <input
            className={fieldClass}
            value={wizard.draft.erasmus}
            maxLength={wizard.erasmusMax}
            onChange={(event) => wizard.setField("erasmus", event.target.value)}
          />
        </label>
      </Card>
      <ExperienceCards wizard={wizard} />
    </div>
  );
}

const PROBLEM_ID = "experience-problem";

/** Figma 110:330: the saved cards, then one card at a time in the "Yeni deneyim" form. */
function ExperienceCards({ wizard }: { wizard: Wizard }) {
  const t = useTranslations("iaIskur.wizard.experience");
  const locale = useLocale();
  const cards = wizard.experienceCards;
  const { form } = cards;
  const problem = cards.problem;
  /** aria-invalid on the field the problem is about, described by the problem (and any hint). */
  const invalid = (field: keyof ExperienceCardForm, hint?: string) => {
    const wrong = cards.invalidField === field;
    const describedBy = [hint, wrong ? PROBLEM_ID : undefined]
      .filter(Boolean)
      .join(" ");
    return {
      "aria-invalid": wrong,
      ...(describedBy ? { "aria-describedby": describedBy } : {}),
    };
  };
  return (
    <section aria-labelledby="experience-cards-title" className="space-y-4">
      <div className="space-y-1">
        <h2
          id="experience-cards-title"
          className="type-title-card text-text-primary"
        >
          {t("cardsTitle")}
        </h2>
        <p className="type-body-sm text-text-secondary">{t("cardsHint")}</p>
      </div>
      {cards.cards.length > 0 ? (
        <ul className="space-y-3">
          {cards.cards.map((card, index) => (
            <li key={`${card.title}-${card.startedOn}-${String(index)}`}>
              <Card className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <h3 className="type-label text-text-primary">
                    {card.organization
                      ? `${card.title} — ${card.organization}`
                      : card.title}
                  </h3>
                  <p className="type-caption text-text-muted">
                    {t("range", {
                      start: formatYearMonth(card.startedOn, locale),
                      end: card.endedOn
                        ? formatYearMonth(card.endedOn, locale)
                        : t("ongoing"),
                    })}
                  </p>
                  {card.summary ? (
                    <p className="type-body-sm text-text-secondary">
                      {card.summary}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={ButtonVariant.Secondary}
                    size={ButtonSize.Small}
                    onClick={() => cards.edit(index)}
                    disabled={form !== null}
                  >
                    {t("edit")}
                    <span className="sr-only">, {card.title}</span>
                  </Button>
                  <Button
                    variant={ButtonVariant.Ghost}
                    size={ButtonSize.Small}
                    onClick={() => cards.remove(index)}
                    disabled={form !== null}
                  >
                    {t("remove")}
                    <span className="sr-only">, {card.title}</span>
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
      {form ? (
        <Card
          labelledBy="experience-form-title"
          className="space-y-4 border-brand-odtu-primary"
        >
          <h3
            id="experience-form-title"
            className="type-label text-text-primary"
          >
            {cards.editingIndex === null ? t("newCard") : t("editCard")}
          </h3>
          <label className="block space-y-2">
            <span className="type-label text-text-primary">
              {t("cardTitle")}
            </span>
            <input
              className={fieldClass}
              value={form.title}
              maxLength={PEER_EXPERIENCE_TITLE_MAX}
              aria-required="true"
              // The form opens on a click; its first field takes the focus.
              autoFocus
              {...invalid("title")}
              onChange={(event) => cards.setField("title", event.target.value)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block space-y-2">
              <span className="type-label text-text-primary">
                {t("organization")}
              </span>
              <input
                className={fieldClass}
                value={form.organization}
                maxLength={PEER_EXPERIENCE_TITLE_MAX}
                aria-required="true"
                {...invalid("organization")}
                onChange={(event) =>
                  cards.setField("organization", event.target.value)
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="type-label text-text-primary">
                {t("startedOn")}
              </span>
              <input
                type="month"
                className={fieldClass}
                value={form.startedOn}
                placeholder={t("monthPlaceholder")}
                aria-required="true"
                {...invalid("startedOn")}
                onChange={(event) =>
                  cards.setField("startedOn", event.target.value)
                }
              />
            </label>
            <div className="space-y-2">
              <label className="block space-y-2">
                <span className="type-label text-text-primary">
                  {t("endedOn")}
                </span>
                <input
                  type="month"
                  className={fieldClass}
                  value={form.endedOn}
                  placeholder={t("monthPlaceholder")}
                  {...invalid("endedOn", "experience-end-hint")}
                  onChange={(event) =>
                    cards.setField("endedOn", event.target.value)
                  }
                />
              </label>
              <span
                id="experience-end-hint"
                className="block type-caption text-text-muted"
              >
                {t("endedOnHint")}
              </span>
            </div>
          </div>
          <label className="block space-y-2">
            <span className="type-label text-text-primary">{t("summary")}</span>
            <textarea
              className={`${fieldClass} min-h-24`}
              value={form.summary}
              maxLength={PEER_EXPERIENCE_SUMMARY_MAX}
              onChange={(event) =>
                cards.setField("summary", event.target.value)
              }
            />
          </label>
          {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
          {/* The evidence file (Kanıt belgesi) comes with document upload (BE-I5, after Friday). */}
          <p className="type-caption text-text-muted">{t("evidenceSoon")}</p>
          {problem ? (
            <p
              id={PROBLEM_ID}
              role="alert"
              className="type-body-sm text-status-error-text"
            >
              {t(`problems.${problem}`)}
            </p>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button variant={ButtonVariant.Secondary} onClick={cards.cancel}>
              {t("cancel")}
            </Button>
            <Button onClick={cards.save}>{t("save")}</Button>
          </div>
        </Card>
      ) : null}
      {cards.canAdd ? (
        <Button variant={ButtonVariant.Ghost} onClick={cards.startNew}>
          <Plus aria-hidden className="size-4" />
          {cards.cards.length === 0 ? t("add") : t("addAnother")}
        </Button>
      ) : null}
    </section>
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
          aria-required="true"
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
  const linkedin = wizard.previewLinkedin;

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center gap-5">
          <InitialsAvatar initials={person.initials} size="lg" />
          <div className="space-y-2">
            <h2 className="type-h2 text-text-primary">{person.fullName}</h2>
            <p className="type-body text-text-secondary">
              {person.department}
              {person.showSeparator ? " · " : null}
              {person.classYear
                ? t("classYear", { classYear: person.classYear })
                : null}
            </p>
            <div className="flex flex-wrap gap-2">
              <Tag>{t("peer")}</Tag>
              {person.badgeVerified ? (
                <Tag tone={TagTone.Success}>{t("badgeVerified")}</Tag>
              ) : null}
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
            {wizard.previewHelpWith}
          </p>
        </div>
        {wizard.draft.experiences.length > 0 ? (
          <div className="space-y-2">
            <h3 className="type-label text-text-primary">{t("experience")}</h3>
            <ul className="space-y-1">
              {wizard.draft.experiences.map((card, index) => (
                <li
                  key={`${card.title}-${card.startedOn}-${String(index)}`}
                  className="type-body-sm text-text-secondary"
                >
                  {card.organization
                    ? `${card.title} — ${card.organization}`
                    : card.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <dl className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="space-y-1">
            <dt className="type-caption text-text-muted">{t("hours")}</dt>
            <dd className="type-body-sm text-text-primary">
              {wizard.weeklyHours.length === 0 ? (
                t("noHours")
              ) : (
                <ul className="flex flex-wrap gap-x-2">
                  {wizard.weeklyHours.map((range) => (
                    <li key={`${range.dayOfWeek}-${range.start}-${range.end}`}>
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
  maxLength,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  maxLength: number;
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
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
