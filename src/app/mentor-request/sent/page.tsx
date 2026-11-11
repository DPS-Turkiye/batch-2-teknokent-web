"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { AppShell } from "@/components/hoc/app-shell";
import { RequestDetailsPanel } from "@/components/mentorships/request-details-panel";
import { Info } from "@/components/product-view-shared";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import { buildRequestDetailContent } from "@/lib/request-detail-content";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

function RequestSentContent() {
  const t = useTranslations("requestSent");
  const tStatus = useTranslations("requestStatus");
  const locale = useLocale();
  const id = useSearchParams().get("request");
  const requestQuery = useMentorshipRequest(id);
  const request = requestQuery.data;
  const detail = request ? buildRequestDetailContent(request) : null;

  // The page only confirms a request that was just sent.
  if (!id) redirect(`/mentorships?tab=${MentorshipWorkspaceTab.Requests}`);

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-xl flex-col items-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#f0f0f0] text-2xl text-[#666]">
          ✓
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-[#171717]">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-[#777]">{t("body")}</p>
        {request ? (
          <div className="mt-7 w-full space-y-4 text-left">
            <dl className="grid w-full grid-cols-2 gap-5 rounded-lg border border-[#e5e7eb] bg-white p-5 text-sm">
              <Info label={t("mentor")} value={request.mentorName} />
              <Info
                label={t("topic")}
                value={detail?.topic || request.supportArea}
              />
              <Info
                label={t("sentAt")}
                value={new Intl.DateTimeFormat(locale, {
                  dateStyle: "long",
                }).format(new Date(request.createdAt))}
              />
              <Info
                label={t("expectedReply")}
                value={t("expectedReplyValue")}
              />
              <Info
                label={t("status")}
                value={tStatus(`short.${request.status}`)}
              />
            </dl>
            <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
              <h2 className="text-sm font-semibold text-[#171717]">
                {t("summary")}
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
          <p className="mt-7 text-sm text-[#777]">{t("loading")}</p>
        ) : (
          <p className="mt-7 text-sm text-[#777]">{t("notFound")}</p>
        )}
        <div className="mt-6 grid w-full gap-2">
          <PrimaryButton
            href={`/mentor-request/status?request=${encodeURIComponent(id)}`}
            className="w-full"
          >
            {t("viewDetails")}
          </PrimaryButton>
          <SecondaryButton
            href={`/mentorships?tab=${MentorshipWorkspaceTab.Requests}`}
            className="w-full"
          >
            {t("myRequests")}
          </SecondaryButton>
          <SecondaryButton
            href="/dashboard"
            className="w-full border-0 bg-transparent"
          >
            {t("home")}
          </SecondaryButton>
        </div>
        <p className="mt-6 text-xs text-[#aaa]">
          {t("changedMind")}{" "}
          <Link
            href={`/mentor-request/status?request=${encodeURIComponent(id)}`}
            className="text-[#555] underline-offset-2 hover:underline"
          >
            {t("withdraw")}
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

export default function RequestSentPage() {
  const t = useTranslations("requestSent");
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-[#777]">
          {t("loading")}
        </div>
      }
    >
      <RequestSentContent />
    </Suspense>
  );
}
