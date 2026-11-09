"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyNote, Panel, QueryNotice } from "@/components/admin/admin-ui";
import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { useAvailabilitySettingsForm } from "@/hooks/use-mentor-profile";
import {
  usePeerMentorGate,
  usePeerMentorProfile,
  usePeerMentorTrainingEntry,
  usePeerRequestDecision,
  useReceivedPeerRequests,
} from "@/hooks/use-peer-mentor-give";
import { BadgeStatus } from "@/interfaces/badges";
import {
  type PeerMentoringRequest,
  PeerMentorGateState,
} from "@/interfaces/peer-mentoring";
import { formatDateTime } from "@/lib/utils";

export const PEER_MENTOR_WIZARD_HREF = "/student/peer-mentoring/profile";

const linkButton =
  "inline-flex h-10 items-center justify-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white";
const outlineButton =
  "inline-flex h-9 items-center justify-center rounded-full border border-[#d4d8dd] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b] disabled:opacity-50";

/** Akran Mentörlüğü › Mentorluk Ver, by where the student stands with the Akran Mentoru badge. */
export function PeerMentorGiveView() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.give");
  const gate = usePeerMentorGate();

  if (gate.isLoading) {
    return (
      <p role="status" className="text-sm text-[#858c96]">
        {t("loading")}
      </p>
    );
  }
  if (gate.state === PeerMentorGateState.NoBadge) {
    return (
      <Notice title={t("noBadge.title")} body={t("noBadge.body")}>
        <TrainingEntry />
      </Notice>
    );
  }
  if (gate.state === PeerMentorGateState.Revoked) {
    const expired = gate.gateAward?.status === BadgeStatus.Expired;
    return (
      <Notice
        title={expired ? t("revoked.expiredTitle") : t("revoked.title")}
        body={t("revoked.body")}
      >
        {gate.gateAward?.reason ? (
          <p className="text-[13px] text-[#4a5059]">
            {t("revoked.reason", { reason: gate.gateAward.reason })}
          </p>
        ) : null}
      </Notice>
    );
  }
  if (gate.state === PeerMentorGateState.Earned) {
    return <EarnedView sessionBehind={gate.sessionBehind} />;
  }
  return null;
}

function TrainingEntry() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.give");
  const entry = usePeerMentorTrainingEntry();
  if (entry.href) {
    return (
      <Link href={entry.href} className={linkButton}>
        {t("noBadge.training")}
      </Link>
    );
  }
  return (
    <div className="space-y-1.5">
      <button type="button" disabled className={outlineButton}>
        {t("noBadge.training")}
      </button>
      {entry.reason ? (
        <p className="text-[12.5px] text-[#858c96]">
          {t(`noBadge.trainingReason.${entry.reason}`)}
        </p>
      ) : null}
    </div>
  );
}

function Notice({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <Panel>
      <div className="space-y-3 p-6">
        <h2 className="text-[16px] font-semibold text-[#22262b]">{title}</h2>
        <p className="text-[13.5px] text-[#676e78]">{body}</p>
        {children}
      </div>
    </Panel>
  );
}

function EarnedView({ sessionBehind }: { sessionBehind: boolean }) {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.give");
  const profile = usePeerMentorProfile(!sessionBehind);

  if (sessionBehind) {
    return <Notice title={t("earned.title")} body={t("earned.signInAgain")} />;
  }
  if (profile.isLoading || profile.error) {
    return <QueryNotice isLoading={profile.isLoading} error={profile.error} />;
  }
  if (!profile.data) {
    return (
      <Notice title={t("earned.title")} body={t("earned.body")}>
        <Link href={PEER_MENTOR_WIZARD_HREF} className={linkButton}>
          {t("earned.createProfile")}
        </Link>
      </Notice>
    );
  }
  return (
    <div className="space-y-10">
      <ReceivedRequests />
      <AvailabilitySection />
      <section aria-labelledby="peer-profile-title" className="space-y-3">
        <SectionTitle id="peer-profile-title">
          {t("profile.title")}
        </SectionTitle>
        <Panel>
          <div className="space-y-3 p-6">
            <p className="text-[13.5px] text-[#4a5059]">
              {profile.data.helpWith}
            </p>
            <Link href={PEER_MENTOR_WIZARD_HREF} className={outlineButton}>
              {t("profile.edit")}
            </Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-[18px] font-semibold text-[#22262b]">
      {children}
    </h2>
  );
}

function ReceivedRequests() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.give");
  const received = useReceivedPeerRequests();
  const decision = usePeerRequestDecision();

  return (
    <>
      <section aria-labelledby="peer-received-title" className="space-y-3">
        <SectionTitle id="peer-received-title">
          {t("received.title")}
        </SectionTitle>
        <QueryNotice
          isLoading={received.query.isLoading}
          error={received.query.error}
        />
        {received.query.data ? (
          <Panel>
            {received.waiting.length === 0 ? (
              <EmptyNote>{t("received.empty")}</EmptyNote>
            ) : (
              <ul className="divide-y divide-[#f0f2f4]">
                {received.waiting.map((request) => (
                  <RequestRow key={request.id} request={request}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`${linkButton} disabled:opacity-50`}
                        disabled={decision.pendingId === request.id}
                        onClick={() => decision.accept(request.id)}
                      >
                        {t("received.accept")}
                      </button>
                      <button
                        type="button"
                        className={outlineButton}
                        disabled={decision.pendingId === request.id}
                        onClick={() => decision.decline(request.id)}
                      >
                        {t("received.decline")}
                      </button>
                    </div>
                  </RequestRow>
                ))}
              </ul>
            )}
          </Panel>
        ) : null}
      </section>
      <section aria-labelledby="peer-mentees-title" className="space-y-3">
        <SectionTitle id="peer-mentees-title">
          {t("mentees.title")}
        </SectionTitle>
        {received.query.data ? (
          <Panel>
            {received.mentees.length === 0 ? (
              <EmptyNote>{t("mentees.empty")}</EmptyNote>
            ) : (
              <ul className="divide-y divide-[#f0f2f4]">
                {received.mentees.map((request) => (
                  <RequestRow key={request.id} request={request} />
                ))}
              </ul>
            )}
          </Panel>
        ) : null}
      </section>
    </>
  );
}

function RequestRow({
  request,
  children,
}: {
  request: PeerMentoringRequest;
  children?: ReactNode;
}) {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.give");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  const facts = [request.mentee.department, tTopic(request.category)].filter(
    Boolean,
  );
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[#22262b]">
          {request.mentee.fullName}
          <span className="font-normal text-[#858c96]">
            {" · "}
            {facts.join(" · ")}
          </span>
        </p>
        <p className="mt-0.5 text-[13px] text-[#676e78]">{request.message}</p>
        <p className="mt-0.5 text-[12px] text-[#858c96]">
          {t("received.sentAt", {
            date: formatDateTime(request.createdAt, locale),
          })}
        </p>
      </div>
      {children}
    </li>
  );
}

function AvailabilitySection() {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.give");
  const availability = useAvailabilitySettingsForm(() => undefined);
  return (
    <section aria-labelledby="peer-availability-title" className="space-y-3">
      <SectionTitle id="peer-availability-title">
        {t("availability.title")}
      </SectionTitle>
      <Panel>
        <div className="space-y-4 p-6">
          <WeeklyAvailabilityEditor editor={availability} />
          <button
            type="button"
            className={outlineButton}
            disabled={!availability.draft || availability.isSaving}
            onClick={() => void availability.save()}
          >
            {availability.isSaving
              ? t("availability.saving")
              : t("availability.save")}
          </button>
        </div>
      </Panel>
    </section>
  );
}
