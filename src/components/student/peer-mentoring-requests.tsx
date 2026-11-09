"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  EmptyNote,
  Panel,
  QueryNotice,
  StatusChip,
} from "@/components/admin/admin-ui";
import { PeerSessionBookingDialog } from "@/components/student/peer-session-booking-dialog";
import { usePeerMentoringRequests } from "@/hooks/use-peer-mentoring";
import { usePeerRequestSessions } from "@/hooks/use-peer-session-booking";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import type { PeerMentoringRequest } from "@/interfaces/peer-mentoring";
import { PEER_REQUEST_STATUS_TONE } from "@/lib/peer-mentoring";
import { formatDateTime } from "@/lib/utils";

const APPOINTMENTS_HREF = "/student/appointments";

/** Mentorluk Al › Taleplerim: requests this student sent, and booking a time once one is accepted. */
export function PeerMentoringRequests() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.requests");
  const tTopic = useTranslations("peerTopics");
  const tStatus = useTranslations("requestStatus.badge");
  const locale = useLocale();
  const requests = usePeerMentoringRequests();
  const sessions = usePeerRequestSessions();
  const [booking, setBooking] = useState<PeerMentoringRequest | null>(null);

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
              {requests.data.map((request) => {
                const session = sessions.byRequest.get(request.id);
                const accepted =
                  request.status === MentorshipRequestStatus.Accepted;
                return (
                  <li
                    key={request.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
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
                      {session ? (
                        <p className="mt-1 text-[12.5px] font-medium text-[#2f9e6b]">
                          {t("sessionAt", {
                            date: formatDateTime(session.startsAt, locale),
                          })}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusChip
                        tone={PEER_REQUEST_STATUS_TONE[request.status]}
                      >
                        {tStatus(request.status)}
                      </StatusChip>
                      {accepted && session ? (
                        <Link
                          href={APPOINTMENTS_HREF}
                          className="inline-flex h-9 items-center justify-center rounded-full border border-[#d4d8dd] bg-white px-3.5 text-[12.5px] font-medium text-[#4a5059] hover:bg-[#f8f9fa]"
                        >
                          {t("seeAppointment")}
                        </Link>
                      ) : null}
                      {accepted && !session && !sessions.isLoading ? (
                        <button
                          type="button"
                          onClick={() => setBooking(request)}
                          className="inline-flex h-9 items-center justify-center rounded-full bg-[#22262b] px-3.5 text-[12.5px] font-medium text-white"
                        >
                          {t("book")}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ) : null}
      {booking ? (
        <PeerSessionBookingDialog
          request={booking}
          onClose={() => setBooking(null)}
        />
      ) : null}
    </section>
  );
}
