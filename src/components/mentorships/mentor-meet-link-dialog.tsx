"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { TranscribeRequestedField } from "@/components/meetings/transcribe-requested-field";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { mentorWorkspaceName } from "@/lib/mentorship-workspace";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";

export function MentorMeetLinkDialog({
  request,
  meetLink,
  transcribeRequested,
  isPending,
  error,
  onMeetLinkChange,
  onTranscribeRequestedChange,
  onClose,
  onSave,
}: {
  request: MentorshipRequest;
  meetLink: string;
  transcribeRequested: boolean;
  isPending: boolean;
  error: string;
  onMeetLinkChange: (value: string) => void;
  onTranscribeRequestedChange: (value: boolean) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("mentorMentorships.meetLinkDialog");
  const tName = useTranslations("mentorMentorships");
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#32373e]/70 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="mentor-meet-link-title"
        className="w-full max-w-[520px] rounded-3xl bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#858c96]">
              {t("eyebrow")}
            </p>
            <h2
              id="mentor-meet-link-title"
              className="mt-1 text-[22px] font-semibold text-[#22262b]"
            >
              {mentorWorkspaceName(request, tName("startupFallback"))}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid size-6 place-items-center text-[#676e78] hover:text-[#22262b]"
          >
            <X className="size-6" />
          </button>
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-[#22262b]">
            {t("label")}
          </span>
          <input
            type="text"
            value={meetLink}
            onChange={(event) => onMeetLinkChange(event.target.value)}
            placeholder="https://meet.google.com/..."
            className="mt-2 min-h-11 w-full rounded-lg border border-[#d4d8dd] px-3.5 text-sm text-[#22262b] outline-none"
          />
        </label>
        <TranscribeRequestedField
          checked={transcribeRequested}
          onChange={onTranscribeRequestedChange}
        />
        {error ? (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>{t("cancel")}</SecondaryButton>
          <PrimaryButton disabled={isPending} onClick={onSave}>
            {isPending ? t("saving") : t("save")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
