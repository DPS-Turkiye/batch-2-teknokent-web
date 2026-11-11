"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import {
  Button,
  buttonClasses,
  ButtonSize,
  ButtonVariant,
} from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { PageHeader } from "@/components/ia/page-header";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import type { useStudentProfileCompletion } from "@/hooks/use-student-profile-completion";
import { PROFILE_PHOTO_TYPES } from "@/lib/personal-profile";

type Completion = ReturnType<typeof useStudentProfileCompletion>;

/** Step 1 (Figma "Profil Tamamlama — 1 · Hoş geldin"): the ODTÜ record, read-only, and an optional photo. */
export function WelcomeStep({
  welcome,
  photo,
}: {
  welcome: Completion["welcome"];
  photo: Completion["photo"];
}) {
  const t = useTranslations("iaProfile.welcome");
  return (
    <>
      <StepHeading
        title={
          welcome.firstName
            ? t("titleNamed", { name: welcome.firstName })
            : t("title")
        }
        subtitle={t("subtitle")}
      />
      <RecordCard welcome={welcome} />
      <PhotoCard photo={photo} />
      <p className="flex items-start gap-2 type-caption text-text-muted">
        <Image
          src="/ia/profile/info.svg"
          alt=""
          width={16}
          height={16}
          className="shrink-0"
        />
        {t("correction")}
      </p>
    </>
  );
}

/** A step's H1 and lead line; shared by the three steps. */
export function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <PageHeader title={title}>
      <p className="type-body-lg text-text-secondary">{subtitle}</p>
    </PageHeader>
  );
}

function RecordCard({ welcome }: { welcome: Completion["welcome"] }) {
  const t = useTranslations("iaProfile.welcome");
  return (
    <section
      aria-labelledby="completion-record"
      className="overflow-hidden rounded-[20px] border border-border-subtle bg-background-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-brand-odtu-bg">
            <Image
              src="/ia/profile/academic-odtu.svg"
              alt=""
              width={20}
              height={20}
            />
          </span>
          <h2
            id="completion-record"
            className="type-title-card text-text-primary"
          >
            {t("recordTitle")}
          </h2>
        </div>
        <StatusBadge
          tone={StatusTone.Neutral}
          icon={
            <Image src="/ia/profile/lock.svg" alt="" width={14} height={14} />
          }
        >
          {t("readOnly")}
        </StatusBadge>
      </div>
      {welcome.isLoading ? (
        <p
          role="status"
          className="border-t border-border-subtle px-6 py-4 type-body text-text-secondary"
        >
          {t("loading")}
        </p>
      ) : welcome.missing ? (
        <p className="border-t border-border-subtle px-6 py-4 type-body text-text-secondary">
          {t("missing")}
        </p>
      ) : welcome.error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-6 py-4 type-body text-status-error-text"
        >
          <p>{t("loadError")}</p>
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Small}
            disabled={welcome.isFetching}
            onClick={welcome.retry}
          >
            {t("retry")}
          </Button>
        </div>
      ) : welcome.facts ? (
        <dl>
          {welcome.facts.map((fact) => (
            <div
              key={fact.key}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-border-subtle px-6 py-4"
            >
              <dt className="type-body text-text-secondary">
                {t(`facts.${fact.key}`)}
              </dt>
              <dd className="min-w-0 break-words type-label text-text-primary">
                {fact.value ?? t("unknown")}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function PhotoCard({ photo }: { photo: Completion["photo"] }) {
  const t = useTranslations("iaProfile.photo");
  return (
    <Card labelledBy="completion-photo" className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <h2 id="completion-photo" className="type-title-card text-text-primary">
          {t("title")}
        </h2>
        <StatusBadge tone={StatusTone.Neutral}>{t("optional")}</StatusBadge>
      </div>
      <div className="flex items-center gap-4">
        {photo.url ? (
          <span
            role="img"
            aria-label={t("current")}
            className="block size-[72px] shrink-0 rounded-full bg-brand-odtu-bg bg-cover bg-center"
            style={{ backgroundImage: `url("${photo.url}")` }}
          />
        ) : (
          <span
            aria-hidden
            className="grid size-[72px] shrink-0 place-items-center rounded-full border border-dashed border-border-default bg-brand-odtu-bg type-h3 text-brand-odtu-strong"
          >
            {photo.initials}
          </span>
        )}
        <div className="flex min-w-0 flex-col items-start gap-2">
          <label
            className={`${buttonClasses(ButtonVariant.Secondary, ButtonSize.Small)} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-selected ${
              photo.isUploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
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
            {photo.isUploading
              ? t("uploading")
              : photo.url
                ? t("replace")
                : t("upload")}
          </label>
          <p className="type-caption text-text-muted">{t("hint")}</p>
        </div>
      </div>
      <p className="max-w-[600px] type-caption text-text-secondary">
        {t("privacy")}
      </p>
    </Card>
  );
}
