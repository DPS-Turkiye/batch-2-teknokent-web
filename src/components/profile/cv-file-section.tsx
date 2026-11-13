"use client";

import { useTranslations } from "next-intl";

import { FileDrop } from "@/components/common/file-drop";
import { CvConsent } from "@/components/onboarding/cv-consent";
import { OnboardingTone } from "@/components/onboarding/onboarding-tone";
import type { CvFileState } from "@/hooks/use-cv-file";

const ACCENT_CLASSES = {
  orange: "border-[#e86f22] text-[#9e4400]",
  blue: "border-[#26a4ff] text-[#26a4ff]",
} as const;

const ACCENT_TONES = {
  orange: OnboardingTone.Mentee,
  blue: OnboardingTone.Mentor,
} as const;

// globals.css gives buttons `font: inherit` outside any layer, so the type
// size needs `!` to take effect.
const buttonTextClass = "text-[12.5px]! font-medium! leading-[19px]!";
const noteClass = "text-[12.5px] text-[#858c96]";

/** The body of a profile's CV card in edit mode; each page supplies the card. */
export function CvFileSection({
  cv,
  accent,
  whoSees,
  filledMessage,
}: {
  cv: CvFileState;
  accent: keyof typeof ACCENT_CLASSES;
  whoSees: string;
  filledMessage: string;
}) {
  const t = useTranslations("cvFile");
  return (
    <>
      <p className="text-[12.5px] leading-[19px] text-[#676e78]">
        {t("intro", { whoSees })}
      </p>
      {cv.canRead ? (
        <CvConsent
          tone={ACCENT_TONES[accent]}
          checked={cv.consent}
          onChange={cv.setConsent}
        />
      ) : null}
      <FileDrop
        file={cv.selected}
        label={t("pick")}
        onChange={cv.choose}
        alreadyStored={cv.storedName ? { name: cv.storedName } : null}
        accept=".pdf"
        helpText={t("help")}
      />
      {!cv.canRead ? (
        <>
          {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
          <p className={noteClass}>{t("manual")}</p>
        </>
      ) : cv.offerFill ? (
        cv.storedIsPdf ? (
          <button
            type="button"
            onClick={cv.fillFromStored}
            disabled={!cv.canFill}
            className={`self-start rounded-full border px-4 py-2 disabled:opacity-50 ${ACCENT_CLASSES[accent]} ${buttonTextClass}`}
          >
            {t("fill")}
          </button>
        ) : (
          <p className={noteClass}>{t("needPdf")}</p>
        )
      ) : null}
      {cv.isUploading ? (
        <p role="status" className={noteClass}>
          {t("uploading")}
        </p>
      ) : cv.isParsing ? (
        <p role="status" className={noteClass}>
          {t("reading")}
        </p>
      ) : null}
      {cv.error ? (
        <p role="alert" className="text-[12px] text-[#b3261e]">
          {cv.error}
        </p>
      ) : null}
      {cv.filled ? (
        <p role="status" className="text-[12px] text-[#0f7a4d]">
          {filledMessage}
        </p>
      ) : null}
    </>
  );
}
