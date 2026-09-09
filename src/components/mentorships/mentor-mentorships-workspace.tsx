"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/hoc/app-shell";
import { MeetLinkDisplay } from "@/components/mentorships/meet-link-display";
import { MentorMeetLinkDialog } from "@/components/mentorships/mentor-meet-link-dialog";
import { MentorRequestReviewDialog } from "@/components/mentorships/mentor-request-review-dialog";
import { MEETINGS_QUERY_KEY } from "@/hooks/use-meetings";
import { useMentorshipWorkspace } from "@/hooks/use-mentorship-workspace";
import { useMentorRequestDecision } from "@/hooks/use-mentorship-requests";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { updateMeeting } from "@/lib/client/meetings";
import { logMentorshipMeeting } from "@/lib/client/mentor-requests";
import { MENTOR_MENTORSHIPS_TABS } from "@/lib/const";
import { formatMeetingShort } from "@/lib/format";
import { normalizeMeetLink } from "@/lib/meet-link";
import {
  formatPreferredSlot,
  preferredSlotStartsAt,
  requestOutcomeFromMessage,
  type ParsedPreferredSlot,
} from "@/lib/mentor-availability-days";
import {
  formatRequestSentAt,
  mentorRequestHref,
  mentorWorkspaceName,
  mentorWorkspacePerson,
  pickRequestMeeting,
  requestProgressPercent,
} from "@/lib/mentorship-workspace";
import { AppArea } from "@/types/app-area";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

export function MentorMentorshipsWorkspace() {
  const { error, historyRequests, isLoading, meetings, requests, setTab, tab } =
    useMentorshipWorkspace(UserRole.Mentor);
  const queryClient = useQueryClient();
  const decisionMutation = useMentorRequestDecision();
  const [reviewing, setReviewing] = useState<MentorshipRequest | null>(null);
  const [editingLink, setEditingLink] = useState<MentorshipRequest | null>(
    null,
  );
  const [meetLinkDraft, setMeetLinkDraft] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  async function acceptRequest(
    request: MentorshipRequest,
    slot: ParsedPreferredSlot | null,
    meetLink: string,
  ) {
    setActionError("");
    const message = slot
      ? `Görüşme saati: ${slot.label || formatPreferredSlot(slot)}`
      : "Talebiniz kabul edildi.";
    const normalizedLink = normalizeMeetLink(meetLink);
    try {
      await decisionMutation.mutateAsync({
        id: request.id,
        status: MentorshipRequestStatus.Accepted,
        message,
      });
      const startsAt = slot
        ? preferredSlotStartsAt(slot)
        : normalizedLink
          ? new Date().toISOString()
          : null;
      if (startsAt) {
        try {
          await logMentorshipMeeting(request.id, {
            mentorId: request.mentorId,
            scheduledAt: startsAt,
            durationMinutes: 45,
            status: MeetingStatus.Scheduled,
            meetLink: normalizedLink || undefined,
          });
        } catch {
          // Acceptance already succeeded; the meeting can be logged later.
        }
      }
      await queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      setReviewing(null);
      setTab(MentorshipWorkspaceTab.Active);
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Talep kabul edilemedi. Lütfen tekrar dene.",
      );
    }
  }

  function openMeetLinkEditor(request: MentorshipRequest) {
    const meeting = pickRequestMeeting(meetings, request);
    setActionError("");
    setMeetLinkDraft(meeting?.meetLink ?? "");
    setEditingLink(request);
  }

  async function saveMeetLink() {
    if (!editingLink) return;
    setLinkSaving(true);
    setActionError("");
    const normalizedLink = normalizeMeetLink(meetLinkDraft);
    const meeting = pickRequestMeeting(meetings, editingLink);
    try {
      if (meeting) {
        await updateMeeting(meeting.id, { meetLink: normalizedLink });
      } else if (normalizedLink) {
        await logMentorshipMeeting(editingLink.id, {
          mentorId: editingLink.mentorId,
          scheduledAt: new Date().toISOString(),
          durationMinutes: 45,
          status: MeetingStatus.Scheduled,
          meetLink: normalizedLink,
        });
      }
      await queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      setEditingLink(null);
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Meet linki kaydedilemedi. Lütfen tekrar dene.",
      );
    } finally {
      setLinkSaving(false);
    }
  }

  return (
    <AppShell active={AppArea.Mentorships}>
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-8 sm:px-8">
        <h1 className="text-[28px] font-medium text-[#22262b]">
          Mentorluklarım
        </h1>

        <div
          className="mt-[22px] grid grid-cols-3"
          role="tablist"
          aria-label="Mentorluk görünümleri"
        >
          {MENTOR_MENTORSHIPS_TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={
                "border-b-[3px] px-3 py-[7px] text-xs font-medium transition " +
                (tab === id
                  ? "border-[#f97316] text-[#e86f22]"
                  : "border-[#e4e7ea] text-[#676e78] hover:text-[#515861]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
            Yükleniyor...
          </div>
        ) : error ? (
          <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {error.message}
          </div>
        ) : tab === MentorshipWorkspaceTab.Active ? (
          <ActiveTab
            requests={requests}
            meetings={meetings}
            onEditMeetLink={openMeetLinkEditor}
          />
        ) : tab === MentorshipWorkspaceTab.History ? (
          <HistoryTab requests={historyRequests} />
        ) : requests.length === 0 ? (
          <EmptyState message="Şu an bekleyen bir talebin yok." />
        ) : (
          <section className="mt-5">
            <h2 className="text-lg font-semibold text-[#22262b]">
              Yeni talepler
            </h2>
            <div className="mt-[22px] grid gap-[22px]">
              {requests.map((request) => (
                <IncomingRequestCard
                  key={request.id}
                  request={request}
                  onReview={() => {
                    setActionError("");
                    setReviewing(request);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {reviewing ? (
        <MentorRequestReviewDialog
          request={reviewing}
          isPending={decisionMutation.isPending}
          error={actionError}
          onClose={() => {
            setReviewing(null);
            setActionError("");
          }}
          onAccept={(slot, meetLink) =>
            void acceptRequest(reviewing, slot, meetLink)
          }
        />
      ) : null}

      {editingLink ? (
        <MentorMeetLinkDialog
          request={editingLink}
          meetLink={meetLinkDraft}
          isPending={linkSaving}
          error={actionError}
          onMeetLinkChange={setMeetLinkDraft}
          onClose={() => {
            setEditingLink(null);
            setActionError("");
          }}
          onSave={() => void saveMeetLink()}
        />
      ) : null}
    </AppShell>
  );
}

function IncomingRequestCard({
  request,
  onReview,
}: {
  request: MentorshipRequest;
  onReview: () => void;
}) {
  const person = mentorWorkspacePerson(request);
  const outcome = requestOutcomeFromMessage(request.requesterMessage);

  return (
    <article className="rounded-[10px] border border-[#e4e7ea] bg-white px-5 py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <h3 className="text-[19px] font-semibold text-[#22262b]">
            {mentorWorkspaceName(request)}
          </h3>
          {person ? (
            <p className="mt-1 text-[13px] text-[#676e78]">{person}</p>
          ) : null}
          <p className="mt-auto pt-6 text-xs text-[#676e78]">
            Talep gönderildi: {formatRequestSentAt(request.createdAt)}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-end gap-6">
          <div className="w-full rounded-[20px] border border-[#e86f22] bg-white p-6">
            {request.summary ? (
              <p className="text-sm text-[#22262b]">“{request.summary}”</p>
            ) : (
              <p className="text-sm text-[#22262b]">{request.supportArea}</p>
            )}
            {outcome ? (
              <p className="mt-4 text-[13px] text-[#676e78]">
                Beklenen çıktı: {outcome}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onReview}
            className="inline-flex min-h-[38px] min-w-[110px] items-center justify-center rounded-lg bg-[#e86f22] px-4 text-[13px] font-medium text-white hover:bg-[#ce5e19]"
          >
            Talebi incele
          </button>
        </div>
      </div>
    </article>
  );
}

function ActiveTab({
  requests,
  meetings,
  onEditMeetLink,
}: {
  requests: MentorshipRequest[];
  meetings: MeetingItem[];
  onEditMeetLink: (request: MentorshipRequest) => void;
}) {
  return (
    <section className="mt-5">
      <h2 className="text-lg font-medium text-[#22262b]">Aktif mentorluklar</h2>
      {requests.length === 0 ? (
        <div className="mt-4 rounded-[10px] border border-[#e4e7ea] bg-white px-6 py-[87px] text-center text-[17px] font-medium text-[#22262b]">
          Aktif Mentörlüğünüz Bulunmamaktadır
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {requests.map((request) => {
            const meeting = pickRequestMeeting(meetings, request);
            const progress = requestProgressPercent(meetings, request);
            return (
              <article
                key={request.id}
                className="rounded-[20px] border border-[#e4e7ea] bg-white p-[18px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[17px] font-medium text-[#22262b]">
                      {mentorWorkspaceName(request)}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-[#676e78]">
                      {mentorWorkspacePerson(request) || request.supportArea}
                    </p>
                  </div>
                  <Link
                    href={mentorRequestHref(request.id)}
                    className="shrink-0 text-[13px] font-medium text-[#e86f22]"
                  >
                    Mentorluğa git →
                  </Link>
                </div>
                <span className="mt-2.5 inline-flex rounded-[14px] bg-[#fdebdd] px-3 py-[7px] text-xs font-medium text-[#e86f22]">
                  {request.supportArea}
                </span>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-md bg-[#e4e7ea]">
                  <div
                    className="h-1.5 rounded-md bg-[#e86f22]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2">
                  <p className="text-[11px] text-[#858c96]">
                    {meeting ? "İlk görüşme" : "Görüşme"}
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium text-[#22262b]">
                    {meeting
                      ? formatMeetingShort(meeting.scheduledAt)
                      : "Henüz planlanmadı"}
                  </p>
                </div>
                <div className="mt-3 border-t border-[#e4e7ea] pt-3">
                  <p className="text-[11px] text-[#858c96]">Meet linki</p>
                  <MeetLinkDisplay
                    meetLink={meeting?.meetLink}
                    className="mt-1"
                  />
                  <button
                    type="button"
                    onClick={() => onEditMeetLink(request)}
                    className="mt-2 text-[13px] font-medium text-[#e86f22]"
                  >
                    {meeting?.meetLink
                      ? "Meet linkini düzenle"
                      : "Meet linki ekle"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HistoryTab({ requests }: { requests: MentorshipRequest[] }) {
  return (
    <section className="mt-5">
      <h2 className="text-lg font-medium text-[#22262b]">
        Yakın zamanda tamamlanan
      </h2>
      {requests.length === 0 ? (
        <EmptyState message="Henüz tamamlanan bir mentorluk yok." />
      ) : (
        <div className="mt-[22px] grid gap-[22px]">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={mentorRequestHref(request.id)}
              className="flex items-center gap-[18px] rounded-[10px] border border-[#e4e7ea] bg-white px-[18px] py-4 transition hover:border-[#f2b78f]"
            >
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#22262b]">
                {mentorWorkspaceName(request)} · {request.supportArea}
              </p>
              <span className="shrink-0 rounded-lg border border-[#e4e7ea] px-4 py-2.5 text-[13px] font-medium text-[#22262b]">
                Mentorluk geçmişi →
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-[20px] border border-dashed border-[#d6dade] bg-white p-12 text-center">
      <Sparkles className="mx-auto size-7 text-[#e86f22]" />
      <h2 className="mt-4 text-base font-semibold">{message}</h2>
    </div>
  );
}
