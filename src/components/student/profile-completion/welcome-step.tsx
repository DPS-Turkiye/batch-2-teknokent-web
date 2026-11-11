"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

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
  const t = useTranslations("studentProfileCompletion.welcome");
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
      <p className="flex items-start gap-2 text-xs leading-4 text-[#6e7681]">
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
    <div className="flex flex-col gap-2">
      <h1 className="text-[26px] font-bold leading-[34px] tracking-[-0.48px] text-[#1c2026] sm:text-[32px] sm:leading-10">
        {title}
      </h1>
      <p className="text-base leading-6 text-[#575f69]">{subtitle}</p>
    </div>
  );
}

function RecordCard({ welcome }: { welcome: Completion["welcome"] }) {
  const t = useTranslations("studentProfileCompletion.welcome");
  return (
    <section
      aria-labelledby="completion-record"
      className="overflow-hidden rounded-[20px] border border-[#e5e9ed] bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-[#fdedef]">
            <Image
              src="/ia/profile/academic-odtu.svg"
              alt=""
              width={20}
              height={20}
            />
          </span>
          <h2
            id="completion-record"
            className="text-base font-bold leading-[22px] tracking-[-0.032px] text-[#1c2026]"
          >
            {t("recordTitle")}
          </h2>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#f4f6f8] px-2.5 py-1.5 text-xs font-medium leading-4 text-[#575f69]">
          <Image src="/ia/profile/lock.svg" alt="" width={14} height={14} />
          {t("readOnly")}
        </span>
      </div>
      {welcome.isLoading ? (
        <p
          role="status"
          className="border-t border-[#e5e9ed] px-6 py-4 text-sm text-[#575f69]"
        >
          {t("loading")}
        </p>
      ) : welcome.missing ? (
        <p className="border-t border-[#e5e9ed] px-6 py-4 text-sm leading-[22px] text-[#575f69]">
          {t("missing")}
        </p>
      ) : welcome.error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e9ed] px-6 py-4 text-sm text-[#6e0816]"
        >
          <p>{t("loadError")}</p>
          <button
            type="button"
            className="h-9 rounded-[12px] border border-[#dce1e6] px-3 text-[13px] font-semibold text-[#1c2026] disabled:opacity-50"
            disabled={welcome.isFetching}
            onClick={welcome.retry}
          >
            {t("retry")}
          </button>
        </div>
      ) : welcome.facts ? (
        <dl>
          {welcome.facts.map((fact) => (
            <div
              key={fact.key}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-[#e5e9ed] px-6 py-4 text-sm"
            >
              <dt className="leading-[22px] text-[#575f69]">
                {t(`facts.${fact.key}`)}
              </dt>
              <dd className="min-w-0 break-words font-medium leading-5 tracking-[-0.014px] text-[#1c2026]">
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
  const t = useTranslations("studentProfileCompletion.photo");
  return (
    <section
      aria-labelledby="completion-photo"
      className="flex flex-col gap-3.5 rounded-[20px] border border-[#e5e9ed] bg-white p-6"
    >
      <div className="flex items-center gap-2">
        <h2
          id="completion-photo"
          className="text-base font-bold leading-[22px] tracking-[-0.032px] text-[#1c2026]"
        >
          {t("title")}
        </h2>
        <span className="flex h-8 items-center rounded-full bg-[#edf0f3] px-3 text-xs font-medium leading-4 text-[#40464f]">
          {t("optional")}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {photo.url ? (
          <span
            role="img"
            aria-label={t("current")}
            className="block size-[72px] shrink-0 rounded-full bg-[#fdedef] bg-cover bg-center"
            style={{ backgroundImage: `url("${photo.url}")` }}
          />
        ) : (
          <span
            aria-hidden
            className="grid size-[72px] shrink-0 place-items-center rounded-full border border-dashed border-[#dce1e6] bg-[#fdedef] text-xl font-bold leading-7 tracking-[-0.1px] text-[#d0112b]"
          >
            {photo.initials}
          </span>
        )}
        <div className="flex min-w-0 flex-col items-start gap-2">
          <label
            className={`inline-flex h-9 cursor-pointer items-center justify-center rounded-[12px] bg-[#fdedef] px-3 text-[13px] font-semibold leading-[18px] text-[#b00e24] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1c2026] ${
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
          <p className="text-xs leading-4 text-[#6e7681]">{t("hint")}</p>
        </div>
      </div>
      <p className="max-w-[600px] text-xs leading-4 text-[#575f69]">
        {t("privacy")}
      </p>
    </section>
  );
}
