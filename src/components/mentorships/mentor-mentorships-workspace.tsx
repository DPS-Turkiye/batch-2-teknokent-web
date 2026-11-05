"use client";

import { ProgramContext } from "@/components/common/program-context";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/hoc/app-shell";
import { ListPagination } from "@/components/common/list-pagination";
import { MeetLinkDisplay } from "@/components/mentorships/meet-link-display";
import { MentorMeetLinkDialog } from "@/components/mentorships/mentor-meet-link-dialog";
import { MentorRequestReviewDialog } from "@/components/mentorships/mentor-request-review-dialog";
import { normalizeDocumentTitles } from "@/components/mentorships/document-request-title-editor";
import { RegularMentorshipsTab } from "@/components/mentorships/regular-mentorships-tab";
import { MEETINGS_QUERY_KEY } from "@/hooks/use-meetings";
import {
  useMentorshipRequestsPage,
  useMentorshipWorkspace,
} from "@/hooks/use-mentorship-workspace";
import { useMentorRequestDecision } from "@/hooks/use-mentorship-requests";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { updateMeeting } from "@/lib/client/meetings";
import { logMentorshipMeeting } from "@/lib/client/mentor-requests";
import {
  MENTOR_MENTORSHIPS_TABS,
  MENTORSHIP_MEETING_DURATION_MINUTES,
} from "@/lib/const";
import {
  MENTOR_ACCENT_STYLE,
  MENTOR_ACCEPT_MESSAGE,
} from "@/lib/const/mentorships";
import { formatMeetingShort } from "@/lib/format";
import { normalizeMeetLink } from "@/lib/meet-link";
import {
  preferredSlotMachineValue,
  preferredSlotStartsAt,
  proposedSlotsMessageLines,
  type ParsedPreferredSlot,
  type PreferredSlot,
} from "@/lib/mentor-availability-days";
import { requestExpectedOutcome } from "@/lib/meeting-context";
import {
  activeMentorshipHref,
  assistantMeetingHref,
  endedMeetingsForRequest,
  formatRequestSentAt,
  meetingAboutHref,
  meetingCallHref,
  mentorRequestStartupHref,
  mentorshipPeriodLabel,
  mentorshipTopics,
  mentorWorkspaceName,
  mentorWorkspacePerson,
  pickRequestMeeting,
  requestProgressPercent,
} from "@/lib/mentorship-workspace";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

export function MentorMentorshipsWorkspace() {
  const t = useTranslations("mentorMentorships");
  const tTabs = useTranslations("mentorships.tabs");
  const { meetings, meetingsError, meetingsLoading, setTab, tab } =
    useMentorshipWorkspace();
  const queryClient = useQueryClient();
  const decisionMutation = useMentorRequestDecision();
  const [reviewing, setReviewing] = useState<MentorshipRequest | null>(null);
  const [editingLink, setEditingLink] = useState<MentorshipRequest | null>(
    null,
  );
  const [meetLinkDraft, setMeetLinkDraft] = useState("");
  const [transcribeRequestedDraft, setTranscribeRequestedDraft] =
    useState(false);
  const [linkSaving, setLinkSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  async function acceptRequest(
    request: MentorshipRequest,
    slot: ParsedPreferredSlot | null,
    meetLink: string,
    transcribeRequested: boolean,
    requestedDocuments: string[],
  ) {
    setActionError("");
    const message = slot
      ? `Görüşme saati: ${preferredSlotMachineValue(slot)}`
      : MENTOR_ACCEPT_MESSAGE;
    const normalizedLink = normalizeMeetLink(meetLink);
    const documents = normalizeDocumentTitles(requestedDocuments);
    try {
      await decisionMutation.mutateAsync({
        id: request.id,
        status: MentorshipRequestStatus.Accepted,
        message,
        requestedDocuments: documents,
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
            durationMinutes: MENTORSHIP_MEETING_DURATION_MINUTES,
            status: MeetingStatus.Scheduled,
            meetLink: normalizedLink || undefined,
            transcribeRequested,
          });
        } catch {}
      }
      await queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      setReviewing(null);
      setTab(MentorshipWorkspaceTab.Active);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("acceptFailed"),
      );
    }
  }

  async function proposeSlots(
    request: MentorshipRequest,
    slots: PreferredSlot[],
    requestedDocuments: string[],
  ) {
    setActionError("");
    const message = [
      "Saatlerinizi beğenmedim; alternatif gün ve saat öneriyorum.",
      ...proposedSlotsMessageLines(slots),
    ].join("\n");
    try {
      await decisionMutation.mutateAsync({
        id: request.id,
        status: MentorshipRequestStatus.CounterProposed,
        message,
        requestedDocuments: normalizeDocumentTitles(requestedDocuments),
      });
      setReviewing(null);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("proposeFailed"),
      );
    }
  }

  async function askInfo(
    request: MentorshipRequest,
    question: string,
    requestedDocuments: string[],
  ) {
    setActionError("");
    try {
      await decisionMutation.mutateAsync({
        id: request.id,
        status: MentorshipRequestStatus.MoreInfoRequested,
        message: question,
        requestedDocuments: normalizeDocumentTitles(requestedDocuments),
      });
      setReviewing(null);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t("askFailed"));
    }
  }

  function openMeetLinkEditor(request: MentorshipRequest) {
    const meeting = pickRequestMeeting(meetings, request);
    setActionError("");
    setMeetLinkDraft(meeting?.meetLink ?? "");
    setTranscribeRequestedDraft(Boolean(meeting?.transcribeRequested));
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
        await updateMeeting(meeting.id, {
          meetLink: normalizedLink,
          transcribeRequested: transcribeRequestedDraft,
        });
      } else if (normalizedLink) {
        await logMentorshipMeeting(editingLink.id, {
          mentorId: editingLink.mentorId,
          scheduledAt: new Date().toISOString(),
          durationMinutes: MENTORSHIP_MEETING_DURATION_MINUTES,
          status: MeetingStatus.Scheduled,
          meetLink: normalizedLink,
          transcribeRequested: transcribeRequestedDraft,
        });
      }
      await queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      setEditingLink(null);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("linkFailed"),
      );
    } finally {
      setLinkSaving(false);
    }
  }

  return (
    <AppShell active={AppArea.Mentorships}>
      <div style={MENTOR_ACCENT_STYLE}>
        <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-8 sm:px-8">
          <h1 className="text-[28px] font-medium text-[#22262b]">
            {t("title")}
          </h1>

          <div
            className="mt-[22px] grid grid-cols-4"
            role="tablist"
            aria-label={t("tabsLabel")}
          >
            {MENTOR_MENTORSHIPS_TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={
                  "px-3 py-[9px] text-[13px] transition " +
                  (tab === id
                    ? "border-b-2 border-[#26a4ff] font-semibold text-[#26a4ff]"
                    : "border-b border-[#e4e7ea] text-[#676e78] hover:text-[#515861]")
                }
              >
                {tTabs(id)}
              </button>
            ))}
          </div>

          {meetingsLoading && tab !== MentorshipWorkspaceTab.Regular ? (
            <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
              {t("loading")}
            </div>
          ) : meetingsError && tab !== MentorshipWorkspaceTab.Regular ? (
            <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              {meetingsError.message}
            </div>
          ) : tab === MentorshipWorkspaceTab.Active ? (
            <ActiveTab
              meetings={meetings}
              onEditMeetLink={openMeetLinkEditor}
            />
          ) : tab === MentorshipWorkspaceTab.History ? (
            <HistoryTab meetings={meetings} />
          ) : tab === MentorshipWorkspaceTab.Regular ? (
            <RegularMentorshipsTab role={UserRole.Mentor} canStart />
          ) : (
            <RequestsTab
              onReview={(request) => {
                setActionError("");
                setReviewing(request);
              }}
            />
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
            onAccept={(
              slot,
              meetLink,
              transcribeRequested,
              requestedDocuments,
            ) =>
              void acceptRequest(
                reviewing,
                slot,
                meetLink,
                transcribeRequested,
                requestedDocuments,
              )
            }
            onPropose={(slots, requestedDocuments) =>
              void proposeSlots(reviewing, slots, requestedDocuments)
            }
            onAskInfo={(question, requestedDocuments) =>
              void askInfo(reviewing, question, requestedDocuments)
            }
          />
        ) : null}

        {editingLink ? (
          <MentorMeetLinkDialog
            request={editingLink}
            meetLink={meetLinkDraft}
            transcribeRequested={transcribeRequestedDraft}
            isPending={linkSaving}
            error={actionError}
            onMeetLinkChange={setMeetLinkDraft}
            onTranscribeRequestedChange={setTranscribeRequestedDraft}
            onClose={() => {
              setEditingLink(null);
              setActionError("");
            }}
            onSave={() => void saveMeetLink()}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function RequestsTab({
  onReview,
}: {
  onReview: (request: MentorshipRequest) => void;
}) {
  const t = useTranslations("mentorMentorships");
  const [page, setPage] = useState(1);
  const { error, isLoading, requests, totalPages } = useMentorshipRequestsPage(
    UserRole.Mentor,
    MentorshipWorkspaceTab.Requests,
    page,
  );

  if (isLoading) {
    return (
      <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
        {t("loading")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error.message}
      </div>
    );
  }
  if (requests.length === 0) {
    return <EmptyState message={t("requests.empty")} />;
  }

  return (
    <section className="mt-5">
      <h2 className="text-lg font-semibold text-[#22262b]">
        {t("requests.title")}
      </h2>
      <div className="mt-[22px] grid gap-[22px]">
        {requests.map((request) => (
          <IncomingRequestCard
            key={request.id}
            request={request}
            onReview={() => onReview(request)}
          />
        ))}
      </div>
      <ListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        label={t("requests.pages")}
      />
    </section>
  );
}

function IncomingRequestCard({
  request,
  onReview,
}: {
  request: MentorshipRequest;
  onReview: () => void;
}) {
  const t = useTranslations("mentorMentorships");
  const locale = useLocale();
  const person = mentorWorkspacePerson(request);
  const outcome = requestExpectedOutcome(request);
  const waitingForMentee =
    request.status === MentorshipRequestStatus.CounterProposed;

  return (
    <article className="rounded-[10px] border border-[#e4e7ea] bg-white px-5 py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <h3 className="text-[19px] font-semibold text-[#22262b]">
            {mentorWorkspaceName(request, t("startupFallback"))}
          </h3>
          <div className="mt-1">
            <ProgramContext name={request.programName} />
          </div>
          {person ? (
            <p className="mt-1 text-[13px] text-[#676e78]">{person}</p>
          ) : null}
          <p className="mt-auto pt-6 text-xs text-[#676e78]">
            {t("requests.sentAt", {
              when: formatRequestSentAt(request.createdAt, new Date(), locale),
            })}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-end gap-6">
          <div className="w-full rounded-[20px] border border-[#26a4ff] bg-white p-6">
            {request.summary ? (
              <p className="text-sm text-[#22262b]">“{request.summary}”</p>
            ) : (
              <p className="text-sm text-[#22262b]">{request.supportArea}</p>
            )}
            {outcome ? (
              <p className="mt-4 text-[13px] text-[#676e78]">
                {t("requests.outcome", { outcome })}
              </p>
            ) : null}
            {waitingForMentee ? (
              <p className="mt-4 text-[13px] font-medium text-[#26a4ff]">
                {t("requests.waitingForMentee")}
              </p>
            ) : request.status === MentorshipRequestStatus.Accepted ? (
              <p className="mt-4 text-[13px] font-medium text-[#676e78]">
                {t("requests.acceptedWaiting")}
              </p>
            ) : null}
          </div>
          {waitingForMentee ? (
            <span className="inline-flex min-h-[38px] min-w-[110px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#676e78]">
              {t("requests.menteeReply")}
            </span>
          ) : request.status === MentorshipRequestStatus.Accepted ? (
            <span className="inline-flex min-h-[38px] min-w-[110px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#676e78]">
              {t("requests.meetingRecord")}
            </span>
          ) : (
            <button
              type="button"
              onClick={onReview}
              className="inline-flex min-h-[38px] min-w-[110px] items-center justify-center rounded-lg bg-[#26a4ff] px-4 text-[13px] font-medium text-white hover:bg-[#1598ef]"
            >
              {t("requests.review")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ActiveTab({
  meetings,
  onEditMeetLink,
}: {
  meetings: MeetingItem[];
  onEditMeetLink: (request: MentorshipRequest) => void;
}) {
  const t = useTranslations("mentorMentorships");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const { error, isLoading, requests, totalPages } = useMentorshipRequestsPage(
    UserRole.Mentor,
    MentorshipWorkspaceTab.Active,
    page,
  );

  if (isLoading) {
    return (
      <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
        {t("loading")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  return (
    <section className="mt-5">
      <h2 className="text-lg font-medium text-[#22262b]">
        {t("active.title")}
      </h2>
      {requests.length === 0 ? (
        <div className="mt-4 rounded-[10px] border border-[#e4e7ea] bg-white px-6 py-[87px] text-center text-[17px] font-medium text-[#22262b]">
          {t("active.empty")}
        </div>
      ) : (
        <>
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
                        {mentorWorkspaceName(request, t("startupFallback"))}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-[#676e78]">
                        {mentorWorkspacePerson(request) || request.supportArea}
                      </p>
                    </div>
                    <Link
                      href={activeMentorshipHref(request, meeting, true)}
                      className="shrink-0 text-[13px] font-medium text-[#26a4ff]"
                    >
                      {t("active.open")}
                    </Link>
                  </div>
                  <span className="mt-2.5 inline-flex rounded-[14px] bg-[#e6f1f8] px-3 py-[7px] text-xs font-medium text-[#26a4ff]">
                    {request.supportArea}
                  </span>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-md bg-[#e4e7ea]">
                    <div
                      className="h-1.5 rounded-md bg-[#26a4ff]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2">
                    <p className="text-[11px] text-[#858c96]">
                      {meeting ? t("active.firstMeeting") : t("active.meeting")}
                    </p>
                    {meeting ? (
                      <Link
                        href={meetingCallHref(meeting.id)}
                        className="mt-0.5 block text-[13px] font-medium text-[#22262b] hover:text-[#26a4ff]"
                      >
                        {formatMeetingShort(meeting.scheduledAt, locale)}
                      </Link>
                    ) : (
                      <p className="mt-0.5 text-[13px] font-medium text-[#22262b]">
                        {t("active.notPlanned")}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 border-t border-[#e4e7ea] pt-3">
                    <p className="text-[11px] text-[#858c96]">
                      {t("active.meetLink")}
                    </p>
                    <MeetLinkDisplay
                      meetLink={meeting?.meetLink}
                      className="mt-1"
                    />
                    <button
                      type="button"
                      onClick={() => onEditMeetLink(request)}
                      className="mt-2 text-[13px] font-medium text-[#26a4ff]"
                    >
                      {meeting?.meetLink
                        ? t("active.editLink")
                        : t("active.addLink")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <ListPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            label={t("active.pages")}
          />
        </>
      )}
    </section>
  );
}

function HistoryTab({ meetings }: { meetings: MeetingItem[] }) {
  const t = useTranslations("mentorMentorships");
  const [page, setPage] = useState(1);
  const { error, isLoading, requests, totalPages } = useMentorshipRequestsPage(
    UserRole.Mentor,
    MentorshipWorkspaceTab.History,
    page,
  );

  if (isLoading) {
    return (
      <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
        {t("loading")}
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2.5 rounded-[20px] border border-[#e4e7ea] bg-white px-6 py-9 text-center">
        <Image
          src="/mentorships/folder-open.svg"
          alt=""
          width={28}
          height={28}
        />
        <p className="text-sm font-medium text-[#4a5059]">
          {t("history.empty")}
        </p>
      </div>
    );
  }

  return (
    <section className="mt-6">
      <div className="grid gap-3">
        {requests.map((request) => (
          <PastMentorshipRow
            key={request.id}
            request={request}
            meetings={meetings}
          />
        ))}
      </div>
      <ListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        label={t("history.pages")}
      />
    </section>
  );
}

function PastMentorshipRow({
  request,
  meetings,
}: {
  request: MentorshipRequest;
  meetings: MeetingItem[];
}) {
  const t = useTranslations("mentorMentorships");
  const locale = useLocale();
  const name = mentorWorkspaceName(request, t("startupFallback"));
  const person = mentorWorkspacePerson(request);
  const ended = endedMeetingsForRequest(meetings, request);
  const latest = ended[0];
  const period = mentorshipPeriodLabel(meetings, request, locale);
  const detailHref = latest
    ? meetingAboutHref(latest.id)
    : mentorRequestStartupHref(request.id);

  return (
    <article className="rounded-[20px] border border-[#e4e7ea] bg-white px-5 py-4">
      <div className="relative">
        <Link
          href={detailHref}
          aria-label={t("history.open", { name })}
          className="absolute inset-0"
        />
        <div className="pointer-events-none flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 lg:w-[280px]">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#f3f4f6] text-xs font-semibold text-[#676e78]">
              {initials(name) || "G"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-[22px] text-[#4a5059]">
                {name}
              </p>
              <p className="truncate text-xs leading-[17px] text-[#858c96]">
                {[person, request.supportArea].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-x-9 gap-y-2">
            {period ? (
              <div className="min-w-0">
                <p className="text-[11px] leading-4 text-[#858c96]">
                  {t("history.period")}
                </p>
                <p className="text-[13px] font-medium leading-[19px] text-[#4a5059]">
                  {period}
                </p>
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] leading-4 text-[#858c96]">
                {t("history.topics")}
              </p>
              <p className="truncate text-[13px] font-medium leading-[19px] text-[#4a5059]">
                {mentorshipTopics(meetings, request)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3.5 text-[12.5px] font-medium leading-[18px] text-[#26a4ff]">
            <Link
              href={mentorRequestStartupHref(request.id)}
              className="pointer-events-auto relative z-10 hover:underline"
            >
              {t("history.files")}
            </Link>
            <Image
              src="/mentorships/expand-right.svg"
              alt=""
              width={16}
              height={16}
            />
          </div>
        </div>
      </div>
      {ended.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {ended.map((meeting) => (
            <Link
              key={meeting.id}
              href={assistantMeetingHref(meeting.id)}
              className="flex items-center justify-between gap-3 rounded-xl bg-[#f5faff] p-3 transition hover:bg-[#e9f5ff]"
            >
              <span className="flex min-w-0 items-center gap-1 text-sm leading-5 text-[#26a4ff]">
                <Image
                  src="/mentorships/file-dock-search.svg"
                  alt=""
                  width={24}
                  height={24}
                />
                {t("history.transcript")}
                {ended.length > 1 ? (
                  <span className="truncate text-xs text-[#858c96]">
                    · {formatMeetingShort(meeting.scheduledAt, locale)}
                  </span>
                ) : null}
              </span>
              <Image
                src="/mentorships/edit-transcript.svg"
                alt=""
                width={24}
                height={24}
              />
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-[20px] border border-dashed border-[#d6dade] bg-white p-12 text-center">
      <Sparkles className="mx-auto size-7 text-[#26a4ff]" />
      <h2 className="mt-4 text-base font-semibold">{message}</h2>
    </div>
  );
}
