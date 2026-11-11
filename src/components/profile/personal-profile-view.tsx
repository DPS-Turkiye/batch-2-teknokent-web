"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { PhotoAvatar } from "@/components/common/avatar";
import { EditableChips } from "@/components/common/editable-chips";
import { AppShell } from "@/components/hoc/app-shell";
import { CvFileSection } from "@/components/profile/cv-file-section";
import { PersonalAnalysisArchive } from "@/components/profile/personal-analysis-archive";
import { ProfileCard as Card } from "@/components/profile/profile-card";
import { usePersonalCv } from "@/hooks/use-personal-cv";
import { usePersonalProfilePage } from "@/hooks/use-personal-profile-page";
import {
  PROFILE_BUTTON_TEXT_CLASS as buttonTextClass,
  PROFILE_CHIP_CLASSES as CHIP_CLASSES,
  PROFILE_EMPTY_CLASS as emptyClass,
  PROFILE_INPUT_CLASS as inputClass,
  PROFILE_LINK_CLASS as linkClass,
  PROFILE_ROW_CLASS as rowClass,
} from "@/lib/const/profile";
import { PROFILE_PHOTO_TYPES } from "@/lib/personal-profile";
import { httpUrlOrNull } from "@/lib/utils";

type PageData = ReturnType<typeof usePersonalProfilePage>;

function EditLink({ page, label }: { page: PageData; label: string }) {
  const t = useTranslations("personalProfile");
  if (page.isEditing) return null;
  return (
    <button
      type="button"
      onClick={page.startEditing}
      aria-label={t("editLabel", { label })}
      className={linkClass}
    >
      {t("edit")}
    </button>
  );
}

function Header({ page }: { page: PageData }) {
  const t = useTranslations("personalProfile");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex flex-wrap items-center justify-between gap-5">
      <div className="flex min-w-0 items-center gap-[18px]">
        <div className="relative shrink-0">
          <PhotoAvatar
            initials={page.initials}
            photoUrl={page.photo.photoUrl}
            className="size-[88px] text-[26px]"
            label={t("photoLabel", { name: page.fullName })}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={page.photo.isUploading}
            aria-label={t("uploadPhoto")}
            className="absolute bottom-0.5 right-[-4px] grid size-6 place-items-center rounded-full disabled:opacity-60"
          >
            <Image
              src="/profile/add-photo.svg"
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={PROFILE_PHOTO_TYPES.join(",")}
            aria-label={t("photoFile")}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) page.photo.upload(file);
              event.target.value = "";
            }}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="break-words text-[28px] font-semibold leading-[1.5] text-[#22262b]">
            {page.fullName}
          </h1>
          {page.subtitle ? (
            <p className="text-[13.5px] leading-[21px] text-[#676e78]">
              {page.subtitle}
            </p>
          ) : null}
          {page.chips.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {page.chips.map((chip) => (
                <li
                  key={chip.label}
                  className={`rounded-full border px-3 py-[5px] text-xs font-medium leading-[19px] ${CHIP_CLASSES[chip.tone]}`}
                >
                  {chip.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {page.isEditing ? (
          <>
            <button
              type="button"
              onClick={page.cancelEditing}
              disabled={page.isSaving}
              className={`rounded-full border border-[#d4d8dd] bg-white px-4 py-2.5 text-[#4a5059] disabled:opacity-50 ${buttonTextClass}`}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={page.save}
              disabled={!page.canSave}
              className={`rounded-full bg-[#e86f22] px-4 py-2.5 text-white disabled:bg-[#c9cdd2] ${buttonTextClass}`}
            >
              {page.isSaving ? t("saving") : t("save")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={page.showComingSoon}
              className={`rounded-full border border-[#d4d8dd] bg-white px-4 py-2.5 text-[#4a5059] ${buttonTextClass}`}
            >
              {t("accountSettings")}
            </button>
            <button
              type="button"
              onClick={page.startEditing}
              className={`rounded-full bg-[#e86f22] px-4 py-2.5 text-white ${buttonTextClass}`}
            >
              {t("editProfile")}
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function CvCard({ page }: { page: PageData }) {
  const t = useTranslations("personalProfile");
  const cv = usePersonalCv(page.draft, page.setField);
  return (
    <Card title={t("cv")}>
      <CvFileSection
        cv={cv}
        accent="orange"
        whoSees={page.cvWhoSees}
        filledMessage={t("cvFilled")}
      />
      <EditableChips
        label={t("expertise")}
        values={cv.expertise}
        onChange={cv.setExpertise}
      />
    </Card>
  );
}

function AboutCard({ page }: { page: PageData }) {
  const t = useTranslations("personalProfile");
  const bio = page.draft?.bio ?? "";
  return (
    <Card
      title={t("about")}
      action={<EditLink page={page} label={t("about")} />}
    >
      {page.isEditing ? (
        <label className="block text-[11.5px] text-[#676e78]">
          {t("about")}
          <textarea
            value={bio}
            maxLength={5000}
            onChange={(event) => page.setField("bio", event.target.value)}
            className={`${inputClass} min-h-24`}
          />
        </label>
      ) : (
        <p className="whitespace-pre-line text-[13px] leading-5 text-[#4a5059]">
          {bio || t("noBio")}
        </p>
      )}
    </Card>
  );
}

function StartupCard({ page }: { page: PageData }) {
  const t = useTranslations("personalProfile");
  if (!page.startup) return null;
  const { startup } = page;
  return (
    <Card
      title={t("startup")}
      action={
        <Link href="/startup" className={linkClass}>
          {t("startupLink")}
        </Link>
      }
    >
      <div className="flex items-center gap-3">
        {startup.logoUrl ? (
          <span
            role="img"
            aria-label={t("logo", { name: startup.name })}
            className="size-10 shrink-0 rounded-[10px] border border-[#e4e7ea] bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${startup.logoUrl}")` }}
          />
        ) : (
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#eef7f0] text-[13px] font-semibold text-[#3f7d5a]"
          >
            {startup.initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium leading-[22px] text-[#22262b]">
            {startup.name}
          </p>
          {startup.summary ? (
            <p className="truncate text-[12px] leading-[19px] text-[#676e78]">
              {startup.summary}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function MentorshipsCard({ page }: { page: PageData }) {
  const t = useTranslations("personalProfile");
  return (
    <Card
      title={t("mentorships")}
      action={
        <Link href="/mentorships" className={linkClass}>
          {t("all")}
        </Link>
      }
    >
      {page.mentorshipsLoading ? (
        <p className={emptyClass}>{t("loading")}</p>
      ) : page.mentorships.length === 0 ? (
        <p className={emptyClass}>{t("noMentorships")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {page.mentorships.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e7ea] px-3.5 py-3 hover:bg-[#fcfcfd]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-[11px] font-semibold text-[#c95c18]"
                  >
                    {row.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium leading-5 text-[#22262b]">
                      {row.mentorName}
                    </span>
                    <span className="block truncate text-[11.5px] leading-[18px] text-[#676e78]">
                      {row.detail}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {row.status ? (
                    <span className="text-[11.5px] font-medium leading-[18px] text-[#9e4400]">
                      {row.status}
                    </span>
                  ) : null}
                  <Image
                    src="/profile/chevron-right.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="size-4"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ContactCard({ page }: { page: PageData }) {
  const t = useTranslations("personalProfile");
  const fields = useTranslations("profileSections");
  const linkedin = httpUrlOrNull(page.draft?.linkedinUrl);
  return (
    <Card
      title={t("contact")}
      action={<EditLink page={page} label={t("contact")} />}
    >
      {page.isEditing && page.draft ? (
        <div className="flex flex-col gap-3">
          <label className="block text-[11.5px] text-[#676e78]">
            {t("fullName")}
            <input
              value={page.draft.fullName}
              maxLength={255}
              aria-invalid={Boolean(page.fieldErrors.fullName)}
              onChange={(event) =>
                page.setField("fullName", event.target.value)
              }
              className={inputClass}
            />
          </label>
          <label className="block text-[11.5px] text-[#676e78]">
            {fields("phone")}
            <input
              type="tel"
              autoComplete="tel"
              value={page.draft.phone ?? ""}
              maxLength={32}
              aria-invalid={Boolean(page.fieldErrors.phone)}
              onChange={(event) => page.setField("phone", event.target.value)}
              className={inputClass}
            />
          </label>
          {page.fieldErrors.phone ? (
            <p role="alert" className="text-[11.5px] text-[#b3261e]">
              {page.fieldErrors.phone}
            </p>
          ) : null}
          <label className="block text-[11.5px] text-[#676e78]">
            {fields("linkedin")}
            <input
              value={page.draft.linkedinUrl ?? ""}
              maxLength={255}
              aria-invalid={Boolean(page.fieldErrors.linkedinUrl)}
              onChange={(event) =>
                page.setField("linkedinUrl", event.target.value)
              }
              className={inputClass}
            />
          </label>
          {page.fieldErrors.linkedinUrl ? (
            <p role="alert" className="text-[11.5px] text-[#b3261e]">
              {page.fieldErrors.linkedinUrl}
            </p>
          ) : null}
          {page.fieldErrors.fullName ? (
            <p role="alert" className="text-[11.5px] text-[#b3261e]">
              {page.fieldErrors.fullName}
            </p>
          ) : null}
          <label className="block text-[11.5px] text-[#676e78]">
            {t("role")}
            <input
              value={page.draft.jobTitle ?? ""}
              maxLength={255}
              onChange={(event) =>
                page.setField("jobTitle", event.target.value)
              }
              className={inputClass}
            />
          </label>
        </div>
      ) : (
        <dl className="flex flex-col gap-3">
          <div className={rowClass}>
            <dt className="text-[12px] text-[#676e78]">{t("email")}</dt>
            <dd className="text-right font-medium text-[#4a5059]">
              {page.email || "—"}
            </dd>
          </div>
          <div className={rowClass}>
            <dt className="text-[12px] text-[#676e78]">{fields("phone")}</dt>
            <dd className="text-right font-medium text-[#4a5059]">
              {page.draft?.phone || "—"}
            </dd>
          </div>
          <div className={rowClass}>
            <dt className="text-[12px] text-[#676e78]">{fields("linkedin")}</dt>
            <dd className="min-w-0 truncate text-right font-medium text-[#4a5059]">
              {linkedin ? (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#c85816] hover:underline"
                >
                  {linkedin.replace(/^https?:\/\/(www\.)?/i, "")}
                </a>
              ) : (
                page.draft?.linkedinUrl || "—"
              )}
            </dd>
          </div>
          <div className={rowClass}>
            <dt className="text-[12px] text-[#676e78]">{t("role")}</dt>
            <dd className="text-right font-medium text-[#4a5059]">
              {page.role || "—"}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}

function AccountCard({ page }: { page: PageData }) {
  const t = useTranslations("personalProfile");
  return (
    <Card title={t("account")}>
      <dl className="flex flex-col gap-3">
        <div className={rowClass}>
          <dt className="text-[#4a5059]">{t("notifications")}</dt>
          <dd className="text-[12px] text-[#858c96]">{t("inApp")}</dd>
        </div>
        <div className={rowClass}>
          <dt className="text-[#4a5059]">{t("calendarSync")}</dt>
          <dd className="text-[12px] text-[#858c96]">{t("notConnected")}</dd>
        </div>
        <div className={rowClass}>
          <dt className="text-[#4a5059]">{t("password")}</dt>
          <dd>
            <button
              type="button"
              onClick={() => void page.sendPasswordReset()}
              disabled={page.isSendingReset || !page.email}
              className="text-[12px]! font-medium! leading-[19px]! text-[#9e4400] disabled:opacity-50"
            >
              {page.isSendingReset ? t("sending") : t("sendReset")}
            </button>
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export function PersonalProfileView() {
  const t = useTranslations("personalProfile");
  const page = usePersonalProfilePage();

  return (
    <AppShell menteeHome>
      {page.isLoading ? (
        <p className="p-10 text-center text-sm text-[#858c96]">
          {t("loading")}
        </p>
      ) : page.loadError || !page.draft ? (
        <p className="p-10 text-center text-sm text-[#b3261e]">
          {page.loadError ?? t("loadFailed")}
        </p>
      ) : (
        <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-[22px] px-4 pb-[72px] pt-3 sm:px-8 xl:px-[106px]">
          <Header page={page} />
          {page.saveError ? (
            <p role="alert" className="text-[12px] text-[#b3261e]">
              {page.saveError}
            </p>
          ) : null}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex flex-col gap-[18px]">
              {page.isEditing ? <CvCard page={page} /> : null}
              <AboutCard page={page} />
              <StartupCard page={page} />
              <MentorshipsCard page={page} />
              <PersonalAnalysisArchive />
            </div>
            <aside className="flex flex-col gap-[18px]">
              <ContactCard page={page} />
              <AccountCard page={page} />
            </aside>
          </div>
        </main>
      )}
    </AppShell>
  );
}
