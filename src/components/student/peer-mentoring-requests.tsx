"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useLocale, useTranslations } from "next-intl";

import {
  EmptyNote,
  Panel,
  QueryNotice,
  StatusChip,
} from "@/components/admin/admin-ui";
import { usePeerMentoringRequests } from "@/hooks/use-peer-mentoring";
import { PEER_REQUEST_STATUS_TONE } from "@/lib/peer-mentoring";
import { formatDateTime } from "@/lib/utils";

/** Mentorluk Al › Taleplerim: requests this student sent. */
export function PeerMentoringRequests() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.requests");
  const tTopic = useTranslations("peerTopics");
  const tStatus = useTranslations("requestStatus.badge");
  const locale = useLocale();
  const requests = usePeerMentoringRequests();

  return (
    <section aria-labelledby="peer-requests-title" className="space-y-3">
      <h2
        id="peer-requests-title"
        className="text-[18px] font-semibold text-[#22262b]"
      >
        {t("title")}
      </h2>
      <QueryNotice isLoading={requests.isLoading} error={requests.error} />
      {requests.data ? (
        <Panel>
          {requests.data.length === 0 ? (
            <EmptyNote>{t("empty")}</EmptyNote>
          ) : (
            <ul className="divide-y divide-[#f0f2f4]">
              {requests.data.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[#22262b]">
                      {request.mentor.fullName}
                      <span className="font-normal text-[#858c96]">
                        {" · "}
                        {tTopic(request.category)}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-[#676e78]">
                      {request.message}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#858c96]">
                      {t("sentAt", {
                        date: formatDateTime(request.createdAt, locale),
                      })}
                    </p>
                  </div>
                  <StatusChip tone={PEER_REQUEST_STATUS_TONE[request.status]}>
                    {tStatus(request.status)}
                  </StatusChip>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
    </section>
  );
}
