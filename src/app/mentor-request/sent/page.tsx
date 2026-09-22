"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { RequestDetailsPanel } from "@/components/mentorships/request-details-panel";
import { Info } from "@/components/product-view-shared";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { buildRequestDetailContent } from "@/lib/request-detail-content";

const statusLabels: Record<MentorshipRequestStatus, string> = {
  [MentorshipRequestStatus.Accepted]: "Kabul edildi",
  [MentorshipRequestStatus.CounterProposed]: "Saat önerildi",
  [MentorshipRequestStatus.Declined]: "Uygun değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek bilgi istendi",
  [MentorshipRequestStatus.Pending]: "Yanıt bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
};

function RequestSentContent() {
  const id = useSearchParams().get("request");
  const requestQuery = useMentorshipRequest(id);
  const request = requestQuery.data;
  const detail = request ? buildRequestDetailContent(request) : null;

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-xl flex-col items-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#f0f0f0] text-2xl text-[#666]">
          ✓
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-[#171717]">
          Mentorluk talebiniz gönderildi
        </h1>
        <p className="mt-2 text-sm text-[#777]">
          Mentor talebinizi değerlendirdiğinde size bildirim göndereceğiz.
        </p>
        {request ? (
          <div className="mt-7 w-full space-y-4 text-left">
            <dl className="grid w-full grid-cols-2 gap-5 rounded-lg border border-[#e5e7eb] bg-white p-5 text-sm">
              <Info label="Mentor" value={request.mentorName} />
              <Info
                label="Talep konusu"
                value={detail?.topic || request.supportArea}
              />
              <Info
                label="Gönderilme tarihi"
                value={new Intl.DateTimeFormat("tr-TR", {
                  dateStyle: "long",
                }).format(new Date(request.createdAt))}
              />
              <Info label="Beklenen yanıt süresi" value="~24 saat" />
              <Info label="Talep durumu" value={statusLabels[request.status]} />
            </dl>
            <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
              <h2 className="text-sm font-semibold text-[#171717]">
                Talep özeti
              </h2>
              <RequestDetailsPanel
                request={request}
                showSentAt={false}
                className="mt-3"
              />
            </section>
          </div>
        ) : requestQuery.error ? (
          <p role="alert" className="mt-7 text-sm text-red-700">
            {requestQuery.error.message}
          </p>
        ) : requestQuery.isLoading ? (
          <p className="mt-7 text-sm text-[#777]">Talep yükleniyor…</p>
        ) : (
          <p className="mt-7 text-sm text-[#777]">
            Talep bilgisi bulunamadı. Gönderdiğin talepleri &quot;Taleplerime
            Git&quot; ile görebilirsin.
          </p>
        )}
        <div className="mt-6 grid w-full gap-2">
          <PrimaryButton
            href={
              id
                ? `/mentor-request/status?request=${encodeURIComponent(id)}`
                : "/mentor-request/status"
            }
            className="w-full"
          >
            Talep Detaylarını Gör
          </PrimaryButton>
          <SecondaryButton href="/mentorships?tab=requests" className="w-full">
            Taleplerime Git
          </SecondaryButton>
          <SecondaryButton
            href="/dashboard"
            className="w-full border-0 bg-transparent"
          >
            Ana Sayfaya Dön
          </SecondaryButton>
        </div>
        {id ? (
          <p className="mt-6 text-xs text-[#aaa]">
            Fikrinizi değiştirdiniz mi?{" "}
            <Link
              href={`/mentor-request/status?request=${encodeURIComponent(id)}`}
              className="text-[#555] underline-offset-2 hover:underline"
            >
              Talebi geri çek
            </Link>
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

export default function RequestSentPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-[#777]">
          Talep yükleniyor…
        </div>
      }
    >
      <RequestSentContent />
    </Suspense>
  );
}
