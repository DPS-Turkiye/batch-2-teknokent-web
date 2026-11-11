"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { MeetingUnavailable } from "@/components/meetings/meeting-unavailable";
import { useMeetingLifecycle } from "@/hooks/use-meeting-lifecycle";
import { MeetingStatus } from "@/interfaces/meeting";
import { AppArea } from "@/types/app-area";

function MeetingSummaryContent() {
  const t = useTranslations("meetingPages.summary");
  const tStatus = useTranslations("meetingPages.status");
  const {
    completeMeeting,
    error,
    isLoading,
    isSaving,
    meeting,
    meetingHref,
    notes,
    outcomes,
  } = useMeetingLifecycle();

  if (!meeting) {
    return (
      <AppShell
        active={AppArea.Meetings}
        title={t("title")}
        backHref="/meetings"
      >
        <MeetingUnavailable error={error} isLoading={isLoading} />
      </AppShell>
    );
  }

  return (
    <AppShell
      active={AppArea.Meetings}
      title={t("title")}
      backHref={meetingHref("/meetings/research")}
    >
      <div className="mx-auto w-full max-w-[1060px] px-4 pb-14 pt-8 sm:px-8">
        <p className="text-sm font-medium text-[#e86f22]">
          {meeting.mentorName ?? t("mentorFallback")} ·{" "}
          {t("minutes", { count: meeting.durationMinutes })}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t("heading")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#676e78]">
          {t("intro")}
        </p>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl border border-[#e4e7ea] bg-white p-6">
            <h2 className="text-base font-semibold">{t("discussed")}</h2>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#fff9f5] p-4 text-sm leading-6 text-[#515861]">
              {notes || t("noNotes")}
            </p>
            <h2 className="mt-7 text-base font-semibold">{t("decisions")}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#515861]">
              {outcomes || t("noDecisions")}
            </p>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl bg-[#e86f22] p-5 text-white shadow-[0_16px_35px_rgba(232,111,34,.18)]">
              <CheckCircle2 className="size-7" />
              <h2 className="mt-4 text-lg font-semibold">{t("info")}</h2>
              <dl className="mt-4 space-y-3 text-sm text-white/85">
                <div className="flex justify-between">
                  <dt>{t("duration")}</dt>
                  <dd className="font-semibold text-white">
                    {t("minutes", { count: meeting.durationMinutes })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("status")}</dt>
                  <dd className="font-semibold text-white">
                    {Object.values(MeetingStatus).includes(meeting.status)
                      ? tStatus(meeting.status)
                      : meeting.status}
                  </dd>
                </div>
              </dl>
            </section>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void completeMeeting()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white hover:bg-[#ce5e19] disabled:opacity-60"
            >
              {isSaving ? t("saving") : t("complete")}{" "}
              <ArrowRight className="size-4" />
            </button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default function MeetingSummaryPage() {
  const t = useTranslations("meetingPages.summary");
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#676e78]">
          {t("loading")}
        </div>
      }
    >
      <MeetingSummaryContent />
    </Suspense>
  );
}
