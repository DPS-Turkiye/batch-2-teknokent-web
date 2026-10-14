"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { StartupNameLink } from "@/components/common/startup-name-link";
import { MentorRequestReviewDialog } from "@/components/mentorships/mentor-request-review-dialog";
import { DocumentRequestChecklist } from "@/components/mentorships/document-request-checklist";
import { MentorAccent } from "@/components/mentorships/mentor-accent";
import { normalizeDocumentTitles } from "@/components/mentorships/document-request-title-editor";
import { MEETINGS_QUERY_KEY } from "@/hooks/use-meetings";
import { useTopicLabel } from "@/hooks/use-option-label";
import {
  useMentorRequestDecision,
  useMentorshipRequest,
} from "@/hooks/use-mentorship-requests";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { MeetingStatus } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import type { OrganizationMember } from "@/interfaces/organization-member";
import type { StartupProfile } from "@/interfaces/organization";
import {
  DocumentKind,
  type StartupDocument,
} from "@/interfaces/startup-document";
import { logMentorshipMeeting } from "@/lib/client/mentor-requests";
import { getOrganizationById } from "@/lib/client/organization";
import { getOrganizationMembersById } from "@/lib/client/organization-members";
import { getOrganizationDocuments } from "@/lib/client/startup-documents";
import { MENTORSHIP_MEETING_DURATION_MINUTES } from "@/lib/const";
import {
  MENTOR_ACCEPT_MESSAGE,
  MENTOR_DECLINE_MESSAGE,
} from "@/lib/const/mentorships";
import {
  STARTUP_INFO_BODY_CLASS,
  STARTUP_INFO_CARD_CLASS,
  STARTUP_INFO_CARD_HINT_CLASS,
  STARTUP_INFO_CARD_TITLE_CLASS,
} from "@/lib/const/programs";
import { normalizeMeetLink } from "@/lib/meet-link";
import { programPersonHref } from "@/lib/program-links";
import {
  preferredSlotMachineValue,
  preferredSlotStartsAt,
  proposedSlotsMessageLines,
  type ParsedPreferredSlot,
  type PreferredSlot,
} from "@/lib/mentor-availability-days";
import {
  formatRequestSentAt,
  mentorRequestMessagesHref,
  mentorWorkspaceName,
  mentorWorkspacePerson,
} from "@/lib/mentorship-workspace";
import {
  buildRequestDetailContent,
  RequestDetailFieldKey,
} from "@/lib/request-detail-content";
import { formatFileSize, formatLongDate, initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

function focusTags(profile: StartupProfile | null, request: MentorshipRequest) {
  const tags = [
    ...(profile?.supportAreas ?? []),
    request.supportArea,
    ...(request.recommendationSnapshot?.startupTechnologies ?? []),
  ]
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)];
}

function needText(request: MentorshipRequest, fallback: string) {
  const detail = buildRequestDetailContent(request);
  const primary = detail.fields.find(
    (field) =>
      field.key === RequestDetailFieldKey.NeedProblem ||
      field.key === RequestDetailFieldKey.ProfileStuck,
  );
  if (primary?.value) return primary.value;
  const outcome = detail.fields.find(
    (field) =>
      field.key === RequestDetailFieldKey.NeedOutcome ||
      field.key === RequestDetailFieldKey.ProfileOutcome,
  );
  return outcome?.value || request.summary?.trim() || fallback;
}

export function MentorRequestStartupDetail({
  requestId,
}: {
  requestId: string;
}) {
  const t = useTranslations("mentorMentorships.startup");
  const locale = useLocale();
  const topicLabel = useTopicLabel();
  const router = useRouter();
  const queryClient = useQueryClient();
  const openDocument = useOpenDocument();
  const decisionMutation = useMentorRequestDecision();
  const [reviewing, setReviewing] = useState(false);
  const [actionError, setActionError] = useState("");

  const requestQuery = useMentorshipRequest(requestId);
  const request = requestQuery.data ?? null;
  const organizationId = request?.organizationId;

  const profileQuery = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: () => getOrganizationById(organizationId as string),
    enabled: Boolean(organizationId),
  });
  const membersQuery = useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: () => getOrganizationMembersById(organizationId as string),
    enabled: Boolean(organizationId),
  });
  const documentsQuery = useQuery({
    queryKey: ["organization-documents", organizationId],
    queryFn: () => getOrganizationDocuments(organizationId as string),
    enabled: Boolean(organizationId),
  });

  const profile = profileQuery.data ?? null;
  const members = membersQuery.data ?? [];
  const documents = useMemo(
    () => documentsQuery.data ?? [],
    [documentsQuery.data],
  );
  const canvas = useMemo(
    () =>
      documents.find((document) => document.kind === DocumentKind.Canvas) ??
      null,
    [documents],
  );
  const files = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.kind !== DocumentKind.Canvas &&
          document.kind !== DocumentKind.Logo,
      ),
    [documents],
  );
  const tags = useMemo(
    () => (request ? focusTags(profile, request) : []),
    [profile, request],
  );

  const isLoading =
    requestQuery.isLoading ||
    (Boolean(organizationId) &&
      (profileQuery.isLoading ||
        membersQuery.isLoading ||
        documentsQuery.isLoading));

  async function acceptRequest(
    slot: ParsedPreferredSlot | null,
    meetLink: string,
    transcribeRequested: boolean,
    requestedDocuments: string[],
  ) {
    if (!request) return;
    setActionError("");
    const message = slot
      ? `Görüşme saati: ${preferredSlotMachineValue(slot)}`
      : MENTOR_ACCEPT_MESSAGE;
    const normalizedLink = normalizeMeetLink(meetLink);
    const documentTitles = normalizeDocumentTitles(requestedDocuments);
    try {
      await decisionMutation.mutateAsync({
        id: request.id,
        status: MentorshipRequestStatus.Accepted,
        message,
        requestedDocuments: documentTitles,
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
      setReviewing(false);
      router.push("/mentorships?tab=active");
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("acceptFailed"),
      );
    }
  }

  async function proposeSlots(
    slots: PreferredSlot[],
    requestedDocuments: string[],
  ) {
    if (!request) return;
    setActionError("");
    try {
      await decisionMutation.mutateAsync({
        id: request.id,
        status: MentorshipRequestStatus.CounterProposed,
        message: proposedSlotsMessageLines(slots).join("\n"),
        requestedDocuments: normalizeDocumentTitles(requestedDocuments),
      });
      setReviewing(false);
      router.push("/mentorships?tab=requests");
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("proposeFailed"),
      );
    }
  }

  async function askInfo(question: string, requestedDocuments: string[]) {
    if (!request) return;
    setActionError("");
    try {
      await decisionMutation.mutateAsync({
        id: request.id,
        status: MentorshipRequestStatus.MoreInfoRequested,
        message: question,
        requestedDocuments: normalizeDocumentTitles(requestedDocuments),
      });
      setReviewing(false);
      router.push("/mentorships?tab=requests");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t("askFailed"));
    }
  }

  async function declineRequest() {
    if (!request) return;
    setActionError("");
    try {
      await decisionMutation.mutateAsync({
        id: request.id,
        status: MentorshipRequestStatus.Declined,
        message: MENTOR_DECLINE_MESSAGE,
      });
      router.push("/mentorships?tab=requests");
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : t("declineFailed"),
      );
    }
  }

  const startupName = request
    ? mentorWorkspaceName(request, t("startupFallback"))
    : t("startupFallback");
  const person = request ? mentorWorkspacePerson(request) : "";
  const contactLine = [
    person,
    members.find((m) => m.fullName === person)?.jobTitle,
  ]
    .filter(Boolean)
    .join(" · ");
  const canDecide =
    request?.status === MentorshipRequestStatus.Pending ||
    request?.status === MentorshipRequestStatus.MoreInfoRequested ||
    request?.status === MentorshipRequestStatus.CounterProposed;

  return (
    <AppShell active={AppArea.Mentorships} mentorHome>
      <MentorAccent enabled>
        <div className="mx-auto w-full max-w-[1228px] px-4 pb-16 pt-3 sm:px-8 lg:px-[106px]">
          <nav
            aria-label={t("breadcrumb")}
            className="flex flex-wrap items-center gap-1.5 text-[12.5px] leading-[19px] text-[#676e78]"
          >
            <Link href="/mentorships" className="hover:text-[#22262b]">
              {t("mentorships")}
            </Link>
            <Image
              src="/startup/expand-muted.svg"
              alt=""
              width={14}
              height={14}
              className="size-3.5"
            />
            <Link
              href="/mentorships?tab=requests"
              className="hover:text-[#22262b]"
            >
              {t("requests")}
            </Link>
            <Image
              src="/startup/expand-muted.svg"
              alt=""
              width={14}
              height={14}
              className="size-3.5"
            />
            <span className="font-medium text-[#4a5059]">
              {request ? (
                <StartupNameLink organizationId={request.organizationId}>
                  {startupName}
                </StartupNameLink>
              ) : (
                startupName
              )}
            </span>
          </nav>

          {isLoading ? (
            <p className="mt-10 text-sm text-[#858c96]">{t("loading")}</p>
          ) : !request ? (
            <p
              role="alert"
              className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {requestQuery.error?.message ?? t("notFound")}
            </p>
          ) : (
            <>
              <header className="mt-[22px] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[var(--ms-accent-soft,#fdebdd)] text-base font-semibold text-[var(--ms-accent,#e86f22)]">
                    {initials(startupName)}
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-[28px] font-semibold leading-[43px]">
                      <StartupNameLink organizationId={request.organizationId}>
                        {startupName}
                      </StartupNameLink>
                    </h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {contactLine ? (
                        <p className="text-[13px] leading-5 text-[#676e78]">
                          {contactLine}
                        </p>
                      ) : null}
                      <span className="rounded-full border border-[var(--ms-accent-soft,#fdebdd)] bg-[var(--ms-accent-faint,#fff4ec)] px-2.5 py-1 text-[11.5px] font-medium leading-[18px] text-[var(--ms-accent,#e86f22)]">
                        {t(`status.${request.status}`)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {canDecide ? (
                    <SecondaryButton
                      onClick={() => void declineRequest()}
                      disabled={decisionMutation.isPending}
                      className="rounded-full px-4 py-2.5 text-[12.5px]"
                    >
                      {t("decline")}
                    </SecondaryButton>
                  ) : null}
                  <SecondaryButton
                    href={mentorRequestMessagesHref(request.id)}
                    className="rounded-full border-[var(--ms-accent-soft,#fdebdd)] bg-[var(--ms-accent-faint,#fff4ec)] px-4 py-2.5 text-[12.5px] text-[var(--ms-accent,#e86f22)] hover:border-[var(--ms-accent,#e86f22)] hover:bg-[var(--ms-accent-soft,#fdebdd)] hover:text-[var(--ms-accent-hover,#c85816)]"
                  >
                    {t("message")}
                  </SecondaryButton>
                  {canDecide ? (
                    <PrimaryButton
                      onClick={() => {
                        setActionError("");
                        setReviewing(true);
                      }}
                      disabled={decisionMutation.isPending}
                      className="rounded-full px-4 py-2.5 text-[12.5px]"
                    >
                      {t("accept")}
                    </PrimaryButton>
                  ) : null}
                </div>
              </header>

              {actionError ? (
                <p role="alert" className="mt-4 text-sm text-red-700">
                  {actionError}
                </p>
              ) : null}

              <div className="mt-[22px] grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label={t("stage")}
                  value={profile?.fundingStage || profile?.maturity || "—"}
                />
                <Metric
                  label={t("sector")}
                  value={
                    profile?.sector ||
                    request.recommendationSnapshot?.startupSector ||
                    "—"
                  }
                />
                <Metric
                  label={t("program")}
                  value={profile?.programLevel || "—"}
                />
                <Metric
                  label={t("requestDate")}
                  value={formatRequestSentAt(
                    request.createdAt,
                    new Date(),
                    locale,
                  )}
                />
              </div>

              <div className="mt-[22px] grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-[18px]">
                  <section className={STARTUP_INFO_CARD_CLASS}>
                    <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                      {t("about")}
                    </h2>
                    <p className={STARTUP_INFO_BODY_CLASS}>
                      {profile?.description?.trim() ||
                        request.recommendationSnapshot?.startupSummary?.trim() ||
                        t("noDescription")}
                    </p>
                  </section>

                  <section className={STARTUP_INFO_CARD_CLASS}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                          {t("canvas")}
                        </h2>
                        <p className={`mt-1 ${STARTUP_INFO_CARD_HINT_CLASS}`}>
                          {t("canvasHint")}
                        </p>
                      </div>
                      {canvas ? (
                        <button
                          type="button"
                          onClick={() => void openDocument(canvas.id)}
                          className="shrink-0 text-[12.5px] font-medium text-[var(--ms-accent-strong,#9e4400)] hover:underline"
                        >
                          {t("view")}
                        </button>
                      ) : null}
                    </div>
                    {canvas ? (
                      <FileRow
                        document={canvas}
                        onOpen={() => void openDocument(canvas.id)}
                      />
                    ) : (
                      <p className={STARTUP_INFO_BODY_CLASS}>{t("noCanvas")}</p>
                    )}
                  </section>

                  <section className={STARTUP_INFO_CARD_CLASS}>
                    <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                      {t("focus")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[var(--ms-accent-soft,#fdebdd)] bg-[var(--ms-accent-faint,#fff4ec)] px-2.5 py-1 text-[11.5px] font-medium leading-[17px] text-[var(--ms-accent-strong,#9e4400)]"
                          >
                            {topicLabel(tag)}
                          </span>
                        ))
                      ) : (
                        <p className={STARTUP_INFO_BODY_CLASS}>
                          {t("noFocus")}
                        </p>
                      )}
                    </div>
                  </section>

                  <section className={STARTUP_INFO_CARD_CLASS}>
                    <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                      {t("need")}
                    </h2>
                    <p
                      className={`${STARTUP_INFO_BODY_CLASS} whitespace-pre-wrap`}
                    >
                      {needText(request, t("noNeed"))}
                    </p>
                  </section>
                </div>

                <aside className="space-y-[18px]">
                  <section className={STARTUP_INFO_CARD_CLASS}>
                    <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                      {t("files")}
                    </h2>
                    {files.length === 0 ? (
                      <p className={STARTUP_INFO_BODY_CLASS}>{t("noFiles")}</p>
                    ) : (
                      <div className="space-y-2.5">
                        {files.map((document) => (
                          <FileRow
                            key={document.id}
                            document={document}
                            onOpen={() => void openDocument(document.id)}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {request ? (
                    <DocumentRequestChecklist
                      scope={{ mentorshipRequestId: request.id }}
                      canManage
                    />
                  ) : null}

                  <section className={STARTUP_INFO_CARD_CLASS}>
                    <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                      {t("team")}
                    </h2>
                    {members.length === 0 ? (
                      <p className={STARTUP_INFO_BODY_CLASS}>{t("noTeam")}</p>
                    ) : (
                      <div className="space-y-3">
                        {members.map((member) => (
                          <MemberRow key={member.id} member={member} />
                        ))}
                      </div>
                    )}
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>

        {reviewing && request ? (
          <MentorRequestReviewDialog
            request={request}
            isPending={decisionMutation.isPending}
            error={actionError}
            onClose={() => {
              setReviewing(false);
              setActionError("");
            }}
            onAccept={(
              slot,
              meetLink,
              transcribeRequested,
              requestedDocuments,
            ) =>
              void acceptRequest(
                slot,
                meetLink,
                transcribeRequested,
                requestedDocuments,
              )
            }
            onPropose={(slots, requestedDocuments) =>
              void proposeSlots(slots, requestedDocuments)
            }
            onAskInfo={(question, requestedDocuments) =>
              void askInfo(question, requestedDocuments)
            }
          />
        ) : null}
      </MentorAccent>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[84px] flex-col justify-center rounded-[20px] border border-[var(--ms-accent-border,#f2b78f)] px-6 py-3">
      <p className="text-[11px] leading-[17px] text-[#858c96]">{label}</p>
      <p className="mt-0.5 text-sm font-medium leading-[22px] text-[#22262b]">
        {value}
      </p>
    </div>
  );
}

function FileRow({
  document,
  onOpen,
}: {
  document: StartupDocument;
  onOpen: () => void;
}) {
  const t = useTranslations("mentorMentorships.startup");
  const locale = useLocale();
  const meta = [
    formatFileSize(document.sizeBytes),
    document.uploadedByName
      ? t("uploadedBy", { name: document.uploadedByName })
      : t("updatedAt", { date: formatLongDate(document.createdAt, locale) }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#e4e7ea] px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Image
          src="/startup/paper.svg"
          alt=""
          width={24}
          height={24}
          className="size-6 shrink-0"
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
            {document.originalFilename}
          </p>
          <p className="truncate text-[11.5px] leading-[17px] text-[#858c96]">
            {meta}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("viewFile", { name: document.originalFilename })}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-[#676e78] hover:bg-[#f7f8f9] hover:text-[#22262b]"
      >
        <Image
          src="/startup/paper.svg"
          alt=""
          width={20}
          height={20}
          className="size-5"
        />
      </button>
    </div>
  );
}

function MemberRow({ member }: { member: OrganizationMember }) {
  const t = useTranslations("mentorMentorships.startup");
  const roleLabel = member.founder ? t("manager") : t("member");
  return (
    <Link
      href={programPersonHref({ userId: member.id })}
      className="flex items-center justify-between gap-3 rounded-lg hover:bg-[#f7f8f9]"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--ms-accent-soft,#fdebdd)] text-[11px] font-medium text-[var(--ms-accent-strong,#a8480e)]">
          {initials(member.fullName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
            {member.fullName}
          </p>
          <p className="truncate text-[11.5px] leading-[17px] text-[#858c96]">
            {[member.jobTitle, member.founder ? t("founder") : null]
              .filter(Boolean)
              .join(" · ") || t("member")}
          </p>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
          member.founder
            ? "bg-[var(--ms-accent-faint,#fff4ec)] text-[var(--ms-accent-strong,#9e4400)]"
            : "bg-[#f2f4f6] text-[#676e78]"
        }`}
      >
        {roleLabel}
      </span>
    </Link>
  );
}
