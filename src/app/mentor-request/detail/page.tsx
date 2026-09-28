"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { Avatar } from "@/components/common/avatar";
import { SecondaryButton } from "@/components/common/secondary-button";
import { AppShell } from "@/components/hoc/app-shell";
import { RequestDetailsPanel } from "@/components/mentorships/request-details-panel";
import { useMentorshipRequest } from "@/hooks/use-mentorship-requests";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import {
  MENTEE_REQUESTS_HREF,
  MENTEE_REQUEST_DETAIL_LABELS as LABELS,
  MENTEE_REQUEST_STATUS_LABELS,
} from "@/lib/const";
import {
  parseProposedSlotsFromMessage,
  requestOutcomeFromMessage,
} from "@/lib/mentor-availability-days";
import { mentorProfileHref } from "@/lib/mentor-profile-request";
import { menteeRequestOwnerLabel } from "@/lib/mentorship-workspace";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

const sentAtFormat = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "long",
  timeStyle: "short",
});

function Shell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      active={AppArea.Mentorships}
      title={LABELS.title}
      backHref={MENTEE_REQUESTS_HREF}
    >
      <div className="mx-auto max-w-[960px] px-4 py-6 sm:px-8">{children}</div>
    </AppShell>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-[#e4e7ea] px-3.5 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[#858c96]">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-[#22262b]">
        {children}
      </dd>
    </div>
  );
}

function OtherDetails({ request }: { request: MentorshipRequest }) {
  const owner = menteeRequestOwnerLabel(request);
  const mentorNote = requestOutcomeFromMessage(request.mentorMessage);
  const proposedSlots = parseProposedSlotsFromMessage(request.mentorMessage);

  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      <InfoRow label={LABELS.status}>
        {MENTEE_REQUEST_STATUS_LABELS[request.status]}
      </InfoRow>
      <InfoRow label={LABELS.sentAt}>
        {sentAtFormat.format(new Date(request.createdAt))}
      </InfoRow>
      {owner ? <InfoRow label={LABELS.requester}>{owner}</InfoRow> : null}
      {request.organizationName ? (
        <InfoRow label={LABELS.startup}>{request.organizationName}</InfoRow>
      ) : null}
      {request.plannedSessionCount ? (
        <InfoRow label={LABELS.plannedSessions}>
          {request.plannedSessionCount}
        </InfoRow>
      ) : null}
      {proposedSlots.length > 0 ? (
        <InfoRow label={LABELS.proposedSlots}>
          <ul className="space-y-1">
            {proposedSlots.map((slot, index) => (
              <li key={`${slot.label}-${index}`}>{slot.label}</li>
            ))}
          </ul>
        </InfoRow>
      ) : null}
      {mentorNote ? (
        <InfoRow label={LABELS.mentorMessage}>{mentorNote}</InfoRow>
      ) : null}
      {request.status === MentorshipRequestStatus.Declined &&
      request.rejectionReason ? (
        <InfoRow label={LABELS.rejectionReason}>
          {request.rejectionReason}
        </InfoRow>
      ) : null}
    </dl>
  );
}

function RequestDetailContent() {
  const params = useSearchParams();
  const requestId = params.get("id") ?? params.get("request");
  const requestQuery = useMentorshipRequest(requestId);
  const request = requestQuery.data;

  if (!requestId) {
    return (
      <Shell>
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 text-center">
          <p className="text-sm font-medium text-[#22262b]">{LABELS.missing}</p>
          <SecondaryButton
            href={MENTEE_REQUESTS_HREF}
            className="mt-4 inline-flex"
          >
            {LABELS.backToRequests}
          </SecondaryButton>
        </section>
      </Shell>
    );
  }

  if (requestQuery.error) {
    return (
      <Shell>
        <p role="alert" className="text-sm text-red-700">
          {requestQuery.error.message}
        </p>
      </Shell>
    );
  }

  if (!request) {
    return (
      <Shell>
        <p className="text-sm text-[#777]">{LABELS.loading}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
        <Avatar initials={initials(request.mentorName) || "MN"} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#858c96]">
            {LABELS.mentor}
          </p>
          <h2 className="truncate text-sm font-semibold text-[#22262b]">
            {request.mentorName}
          </h2>
          <p className="mt-0.5 truncate text-xs text-[#777]">
            {request.supportArea}
          </p>
        </div>
        <SecondaryButton href={mentorProfileHref(request.mentorId)}>
          {LABELS.mentorProfile}
        </SecondaryButton>
      </section>

      <section className="mt-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
        <h3 className="text-base font-semibold text-[#22262b]">
          {LABELS.requestSection}
        </h3>
        <RequestDetailsPanel
          request={request}
          showSentAt={false}
          className="mt-4"
        />
      </section>

      <section className="mt-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
        <h3 className="text-base font-semibold text-[#22262b]">
          {LABELS.otherSection}
        </h3>
        <OtherDetails request={request} />
      </section>
    </Shell>
  );
}

export default function MenteeRequestDetailPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-sm text-[#777]">{LABELS.loading}</p>
        </Shell>
      }
    >
      <RequestDetailContent />
    </Suspense>
  );
}
