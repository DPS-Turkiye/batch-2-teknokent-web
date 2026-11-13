"use client";

import { GraduationCap, Info, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { MyBadgesSection } from "@/components/badges/my-badges-section";
import { PhotoAvatar } from "@/components/common/avatar";
import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { InlineAlert } from "@/components/ia/inline-alert";
import { PageHeader } from "@/components/ia/page-header";
import { StatusTone } from "@/components/ia/status-badge";
import { ProductTourReplayButton } from "@/components/product-tour/product-tour-replay-button";
import { InitialsAvatar } from "@/components/student/ia/ui";
import {
  GoalField,
  SubtopicPicker,
  TopicPicker,
} from "@/components/student/interest-pickers";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import {
  useStudentInstitution,
  useStudentInterests,
} from "@/hooks/use-student-profile";
import type { InstitutionRecord } from "@/interfaces/institution";
import { Workspace } from "@/interfaces/workspace";
import { PROFILE_PHOTO_TYPES } from "@/lib/personal-profile";
import { initials } from "@/lib/utils";

/** Profilim (Figma 83:876). */
export function StudentProfileView() {
  const t = useTranslations("iaStudent.profile");
  const institution = useStudentInstitution();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")}>
        <p className="type-body text-text-secondary">{t("subtitle")}</p>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <InterestsCard />
          <InstitutionCard institution={institution} />
          <MyBadgesSection />
        </div>
        <aside className="flex flex-col gap-6">
          <PhotoCard name={institution.record?.fullName ?? null} />
          {institution.record?.advisor ? (
            <AdvisorCard record={institution.record} />
          ) : null}
          <div className="flex items-start gap-3 rounded-card border border-border-default bg-background-muted p-5">
            <Info
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-icon-default"
              strokeWidth={1.5}
            />
            <div>
              <p className="type-label-lg text-text-primary">
                {t("visibility.title")}
              </p>
              <p className="type-body-sm text-text-primary">
                {t("visibility.body")}
              </p>
            </div>
          </div>
          <div>
            <ProductTourReplayButton workspace={Workspace.OdtuStudent} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function InterestsCard() {
  const t = useTranslations("iaStudent.profile.interests");
  const tSub = useTranslations("studentProfileCompletion.subtopics");
  const topicLabel = useTranslations("peerTopics");
  const interests = useStudentInterests();
  const { saved, draft } = interests;

  return (
    <Card labelledBy="profile-interests">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="profile-interests" className="type-h4 text-text-primary">
          {t("title")}
        </h2>
        {saved && !draft ? (
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Small}
            onClick={interests.startEditing}
          >
            {t("edit")}
          </Button>
        ) : null}
      </div>
      {interests.isLoading ? (
        <p role="status" className="mt-4 type-body-sm text-text-muted">
          {t("loading")}
        </p>
      ) : interests.loadError ? (
        <InlineAlert
          tone={StatusTone.Error}
          title={t("loadError")}
          className="mt-4"
        >
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Small}
            disabled={interests.isFetching}
            onClick={interests.retry}
            className="mt-2"
          >
            {t("retry")}
          </Button>
        </InlineAlert>
      ) : draft ? (
        // TEST UI: placeholder until the design team's screen; replace when it arrives.
        <form
          className="mt-5 flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            interests.save();
          }}
        >
          <fieldset
            disabled={interests.isSaving}
            className="flex min-w-0 flex-col gap-5"
          >
            <legend className="sr-only">{t("title")}</legend>
            <TopicPicker
              categories={interests.categories}
              selected={draft.topics}
              onToggle={interests.toggleTopic}
            />
            <SubtopicPicker
              groups={interests.chosen}
              selected={draft.subtopics}
              onToggle={interests.toggleSubtopic}
            />
            <GoalField value={draft.goal} onChange={interests.setGoal} />
            {interests.saveError ? (
              <InlineAlert tone={StatusTone.Error}>
                {t("saveError")}
              </InlineAlert>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant={ButtonVariant.Ghost} onClick={interests.cancel}>
                {t("cancel")}
              </Button>
              <Button type="submit">
                {interests.isSaving ? t("saving") : t("save")}
              </Button>
            </div>
          </fieldset>
        </form>
      ) : saved ? (
        saved.topics.length === 0 && !saved.goal ? (
          <p className="mt-4 type-body-sm text-text-secondary">{t("empty")}</p>
        ) : (
          <dl className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <dt className="type-caption text-text-primary">{t("topics")}</dt>
              <dd>
                <ul className="flex flex-wrap gap-2">
                  {interests.chosen.map((item) => (
                    <Chip key={item.id}>{topicLabel(item.id)}</Chip>
                  ))}
                  {interests.savedSubtopics.map((sub) => (
                    <Chip key={sub.id}>{tSub(sub.labelKey)}</Chip>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="type-caption text-text-primary">{t("goal")}</dt>
              <dd className="type-body whitespace-pre-line text-text-primary">
                {saved.goal || t("noGoal")}
              </dd>
            </div>
          </dl>
        )
      ) : null}
    </Card>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full bg-background-selected px-3 py-1.5 type-label-sm text-text-accent">
      {children}
    </li>
  );
}

function InstitutionCard({
  institution,
}: {
  institution: ReturnType<typeof useStudentInstitution>;
}) {
  const t = useTranslations("iaStudent.profile.institution");
  const record = institution.record;
  return (
    <section
      aria-labelledby="profile-institution"
      className="overflow-hidden rounded-card border border-border-default bg-background-surface"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-6">
        <div>
          <h2 id="profile-institution" className="type-h4 text-text-primary">
            {t("title")}
          </h2>
          <p className="type-caption text-text-muted">{t("source")}</p>
        </div>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-background-muted px-3 type-label-sm text-text-secondary">
          <Lock aria-hidden className="size-3.5" strokeWidth={1.5} />
          {t("locked")}
        </span>
      </div>
      {institution.isLoading ? (
        <p role="status" className="px-6 pb-6 type-body-sm text-text-muted">
          {t("loading")}
        </p>
      ) : institution.missing ? (
        <div className="px-6 pb-6">
          <p className="type-label text-text-primary">{t("missingTitle")}</p>
          <p className="type-body-sm text-text-secondary">{t("missingBody")}</p>
        </div>
      ) : institution.error ? (
        <div className="px-6 pb-6">
          <InlineAlert tone={StatusTone.Error} title={t("loadError")}>
            <Button
              variant={ButtonVariant.Ghost}
              size={ButtonSize.Small}
              disabled={institution.isFetching}
              onClick={institution.retry}
              className="mt-2"
            >
              {t("retry")}
            </Button>
          </InlineAlert>
        </div>
      ) : record ? (
        <dl className="divide-y divide-border-subtle border-t border-border-subtle">
          <Row label={t("fullName")} value={record.fullName} />
          <Row label={t("email")} value={record.email} />
          <Row label={t("department")} value={record.departmentName} />
          <Row label={t("classYear")} value={institution.classLine} />
        </dl>
      ) : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  const t = useTranslations("iaStudent.profile.institution");
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 py-4">
      <dt className="type-body text-text-secondary">{label}</dt>
      <dd className="type-label-lg text-text-primary">
        {value ?? t("unknown")}
      </dd>
    </div>
  );
}

function PhotoCard({ name }: { name: string | null }) {
  const t = useTranslations("iaStudent.profile.photo");
  const photo = useProfilePhoto();
  return (
    <Card labelledBy="profile-photo">
      <div className="flex items-center gap-3">
        <h2 id="profile-photo" className="type-h4 text-text-primary">
          {t("title")}
        </h2>
        <span className="rounded-full bg-background-muted px-2.5 py-1 type-label-sm text-text-secondary">
          {t("optional")}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <PhotoAvatar
          initials={name ? initials(name) : ""}
          photoUrl={photo.photoUrl}
          className="size-[72px] bg-background-selected type-h3 text-text-accent"
          decorative
        />
        <div className="flex flex-col gap-2">
          <label
            className={`inline-flex h-9 w-fit cursor-pointer items-center rounded-button-sm bg-action-secondary-bg px-3 type-button-sm text-action-secondary-fg focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-border-selected ${
              photo.isUploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {photo.isUploading ? t("uploading") : t("upload")}
            <input
              type="file"
              accept={PROFILE_PHOTO_TYPES.join(",")}
              className="sr-only"
              disabled={photo.isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) photo.upload(file);
                event.target.value = "";
              }}
            />
          </label>
          <p className="type-caption text-text-muted">{t("formats")}</p>
        </div>
      </div>
      <p className="mt-4 type-caption text-text-secondary">{t("note")}</p>
    </Card>
  );
}

function AdvisorCard({ record }: { record: InstitutionRecord }) {
  const t = useTranslations("iaStudent.profile.advisor");
  const advisor = record.advisor;
  if (!advisor) return null;
  return (
    <section
      aria-labelledby="profile-advisor"
      className="flex flex-col gap-3 rounded-card border border-card-featured-border bg-background-surface p-6"
    >
      <p className="flex items-center gap-2 type-overline text-text-accent">
        <GraduationCap aria-hidden className="size-4" strokeWidth={1.5} />
        {t("label")}
      </p>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={advisor.fullName} />
        <div>
          <h2 id="profile-advisor" className="type-label-lg text-text-primary">
            {[advisor.academicTitle, advisor.fullName]
              .filter(Boolean)
              .join(" ")}
          </h2>
        </div>
      </div>
      <p className="type-caption text-text-secondary">{t("note")}</p>
    </section>
  );
}
