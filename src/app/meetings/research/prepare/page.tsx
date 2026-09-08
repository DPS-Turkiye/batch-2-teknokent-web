"use client";

import { Suspense, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { Card } from "@/components/product-view-shared";
import { MeetingUnavailable } from "@/components/meetings/meeting-unavailable";
import { useMeetingLifecycle } from "@/hooks/use-meeting-lifecycle";
import { MEETING_PREPARE_CHECKLIST } from "@/lib/const";
import { meetingCountdownLabel } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

function MeetingPreparationContent() {
  const { error, isLoading, meeting, meetingHref } = useMeetingLifecycle();
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  function toggle(label: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }
  if (!meeting) {
    return (
      <AppShell
        active={AppArea.Actions}
        title="Toplantıya hazırlanın"
        backHref="/meetings"
      >
        <MeetingUnavailable error={error} isLoading={isLoading} />
      </AppShell>
    );
  }
  return (
    <AppShell
      active={AppArea.Actions}
      title="Toplantıya hazırlanın"
      backHref={meetingHref("/meetings/research")}
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <h2 className="text-sm font-semibold">
            △ {meetingCountdownLabel(meeting.scheduledAt)}
          </h2>
          <p className="mt-2 text-xs text-[#777]">
            {MEETING_PREPARE_CHECKLIST.length - checked.size} görev
            tamamlanmadı. Toplantı öncesinde hazırlığınızı tamamlamanız
            önerilir.
          </p>
        </section>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card title="Toplantının Amacı">
              <p className="whitespace-pre-wrap font-medium leading-6">
                {meeting.agenda ?? "Bu görüşme için gündem eklenmemiş."}
              </p>
            </Card>
            <Card title="Hazırlık Listesi">
              <div className="space-y-2">
                {MEETING_PREPARE_CHECKLIST.map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(label)}
                      onChange={() => toggle(label)}
                      className="size-4 accent-[#555]"
                    />
                    <span
                      className={
                        checked.has(label) ? "text-[#aaa] line-through" : ""
                      }
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
          <div>
            <Card title="Toplantı Bilgileri">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-[#777]">Mentor</dt>
                  <dd className="mt-1 font-medium">
                    {meeting.mentorName ?? "Mentor bilgisi bekleniyor"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#777]">Süre</dt>
                  <dd className="mt-1 font-medium">
                    {meeting.durationMinutes} dakika
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <PrimaryButton href={meetingHref("/meetings/research")}>
            Toplantı Detayına Git ›
          </PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}

export default function MeetingPreparationPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#676e78]">
          Yükleniyor…
        </div>
      }
    >
      <MeetingPreparationContent />
    </Suspense>
  );
}
