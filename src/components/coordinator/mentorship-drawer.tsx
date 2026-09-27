"use client";

import { Flag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";

import {
  Avatar,
  EmptyNote,
  QueryNotice,
  StatusChip,
} from "@/components/admin/admin-ui";
import {
  MeetingProposalPanel,
  ProposeMeetingDialog,
} from "@/components/coordinator/meeting-proposal-panel";
import { useCoordinatorMentorshipDrawer } from "@/hooks/use-coordinator-mentorships";
import type { MentorshipMeetingProposals } from "@/hooks/use-meeting-proposals";
import type { CoordinatorMentorshipDetail } from "@/interfaces/coordinator-mentorship";
import { MeetingStatus } from "@/interfaces/meeting";
import {
  cadenceAlert,
  coordinatorMessageHref,
  goalPercent,
  HEALTH_LABELS,
  HEALTH_TONES,
  MentorshipDrawerTab,
  mentorLoadLabel,
  notesSummary,
} from "@/lib/coordinator-mentorships";
import { formatDateTime, formatShortDate, initials } from "@/lib/utils";

export function MentorshipDrawer({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const drawer = useCoordinatorMentorshipDrawer(id);
  const detail = drawer.query.data;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#22262b]/20">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Mentorluk detayı"
        className="relative m-3 flex w-full max-w-[600px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(33,38,43,0.18)]"
      >
        <header className="px-7 pt-7">
          <div className="flex items-start gap-3">
            {detail ? (
              <span className="flex -space-x-1.5">
                <Avatar
                  initials={initials(detail.mentorship.mentorName)}
                  tone="blue"
                  size="lg"
                />
                <Avatar
                  initials={initials(detail.mentorship.organizationName)}
                  size="lg"
                />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              {detail ? (
                <>
                  <h2 className="flex flex-wrap items-center gap-2 text-[19px] font-semibold text-[#22262b]">
                    {detail.mentorship.mentorName} ↔{" "}
                    {detail.mentorship.organizationName}
                    <StatusChip tone={HEALTH_TONES[detail.mentorship.health]}>
                      {HEALTH_LABELS[detail.mentorship.health]}
                    </StatusChip>
                  </h2>
                  <p className="mt-1 text-[12.5px] text-[#858c96]">
                    {headerLine(detail)}
                  </p>
                </>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="grid size-9 place-items-center rounded-full bg-[#f4f5f7] text-[#676e78]"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
          {detail ? (
            <div
              role="tablist"
              className="mt-5 grid grid-cols-3 border-b border-[#eef0f2] text-[13.5px]"
            >
              <Tab
                active={drawer.tab === MentorshipDrawerTab.Summary}
                onClick={() => drawer.setTab(MentorshipDrawerTab.Summary)}
              >
                Özet
              </Tab>
              <Tab
                active={drawer.tab === MentorshipDrawerTab.Meetings}
                onClick={() => drawer.setTab(MentorshipDrawerTab.Meetings)}
              >
                Görüşmeler{" "}
                <span className="text-[#aeb4bc]">{detail.meetings.length}</span>
              </Tab>
              <Tab
                active={drawer.tab === MentorshipDrawerTab.Progress}
                onClick={() => drawer.setTab(MentorshipDrawerTab.Progress)}
              >
                İlerleme
              </Tab>
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          <QueryNotice
            isLoading={drawer.query.isLoading}
            error={drawer.query.error}
          />
          {detail && drawer.tab === MentorshipDrawerTab.Summary ? (
            <SummaryTab
              detail={detail}
              proposals={drawer.proposals}
              onRemind={drawer.remind}
              reminding={drawer.reminding}
              reminded={drawer.reminded}
              remindError={drawer.remindError}
            />
          ) : null}
          {detail && drawer.tab === MentorshipDrawerTab.Meetings ? (
            <MeetingsTab detail={detail} />
          ) : null}
          {detail && drawer.tab === MentorshipDrawerTab.Progress ? (
            <ProgressTab detail={detail} />
          ) : null}
        </div>

        {detail ? (
          <footer className="flex items-center justify-between gap-3 border-t border-[#eef0f2] px-7 py-4">
            <button
              type="button"
              onClick={drawer.remind}
              disabled={drawer.reminding || drawer.reminded}
              className="inline-flex h-10 items-center rounded-full border border-[#e9ecef] px-4 text-[13px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
            >
              {drawer.reminded
                ? "Hatırlatma gönderildi"
                : "İki tarafa hatırlat"}
            </button>
            <Link
              href={coordinatorMessageHref(
                detail.mentorship.programId,
                detail.mentorship.mentorId,
              )}
              className="inline-flex h-10 items-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white"
            >
              Mesaj gönder
            </Link>
          </footer>
        ) : null}
        {detail ? (
          <ProposeMeetingDialog
            proposals={drawer.proposals}
            pairLabel={`${detail.mentorship.mentorName} ↔ ${detail.mentorship.organizationName}`}
          />
        ) : null}
      </section>
    </div>
  );
}

function headerLine(detail: CoordinatorMentorshipDetail) {
  const row = detail.mentorship;
  const parts = [row.programName];
  if (row.topic) parts.push(row.topic);
  parts.push(`${detail.pastMeetings} görüşme`);
  if (row.startDate) parts.push(`başlangıç ${formatShortDate(row.startDate)}`);
  return parts.join(" · ");
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 pb-3 ${
        active
          ? "border-[#22262b] font-medium text-[#22262b]"
          : "border-transparent text-[#858c96]"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryTab({
  detail,
  proposals,
  onRemind,
  reminding,
  reminded,
  remindError,
}: {
  detail: CoordinatorMentorshipDetail;
  proposals: MentorshipMeetingProposals;
  onRemind: () => void;
  reminding: boolean;
  reminded: boolean;
  remindError: Error | null;
}) {
  const alert = cadenceAlert(detail);
  const row = detail.mentorship;
  return (
    <div className="space-y-6">
      {alert ? (
        <div className="rounded-[22px] bg-[#fdeeee] p-5">
          <p className="flex items-center gap-2 text-[14.5px] font-medium text-[#d9464b]">
            <Flag aria-hidden className="size-4" /> {alert.title}
          </p>
          <p className="mt-2 text-[13px] text-[#22262b]">{alert.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {proposals.open ? null : (
              <button
                type="button"
                onClick={proposals.openComposer}
                className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white"
              >
                Görüşme planla
              </button>
            )}
            <button
              type="button"
              onClick={onRemind}
              disabled={reminding || reminded}
              className="inline-flex h-9 items-center rounded-full border border-[#e9ecef] bg-white px-4 text-[12.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
            >
              {reminded ? "Hatırlatma gönderildi" : "İki tarafa hatırlat"}
            </button>
            <Link
              href={coordinatorMessageHref(row.programId, row.mentorId)}
              className="inline-flex h-9 items-center rounded-full border border-[#e9ecef] bg-white px-4 text-[12.5px] font-medium text-[#22262b]"
            >
              Mentora yaz
            </Link>
          </div>
          {remindError ? (
            <p className="mt-2 text-[12px] text-[#d9464b]">
              {remindError.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <Section title="Görüşme önerisi">
        <MeetingProposalPanel proposals={proposals} />
      </Section>

      <Section title="Taraflar">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#eaf6ff] px-4 py-3">
            <p className="text-[13.5px] font-medium text-[#22262b]">
              {row.mentorName}
            </p>
            <p className="text-[12px] text-[#1583d6]">
              {mentorLoadLabel(detail)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fff1ec] px-4 py-3">
            <p className="text-[13.5px] font-medium text-[#22262b]">
              {row.organizationName}
            </p>
            <p className="text-[12px] text-[#e0522a]">
              {detail.founderName ? `Yetkili: ${detail.founderName} · ` : ""}
              {detail.memberCount} üye
            </p>
          </div>
        </div>
      </Section>

      <Section title="Görev ilerlemesi">
        <GoalProgress detail={detail} />
      </Section>

      <Section title="Görüşme notları">
        <p className="rounded-2xl bg-[#f7f8f9] px-4 py-3 text-[13px] text-[#22262b]">
          {notesSummary(detail)}
        </p>
      </Section>
    </div>
  );
}

function GoalProgress({ detail }: { detail: CoordinatorMentorshipDetail }) {
  const percent = goalPercent(detail);
  return (
    <div className="rounded-2xl border border-[#e9ecef] p-4">
      <div className="flex items-center justify-between gap-3 text-[13.5px]">
        <span className="text-[#22262b]">
          {detail.goalsDone} / {detail.goalsTotal} görev tamamlandı · %{percent}
        </span>
        {detail.mentorship.overdueActions > 0 ? (
          <span className="text-[12.5px] text-[#d9464b]">
            {detail.mentorship.overdueActions} gecikmiş
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Görev ilerlemesi"
        className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef0f2]"
      >
        <div
          className="h-full rounded-full bg-[#b7791f]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-[#858c96]">
        Görev başlıkları yalnızca mentor ve takıma görünür.
      </p>
    </div>
  );
}

function MeetingsTab({ detail }: { detail: CoordinatorMentorshipDetail }) {
  if (detail.meetings.length === 0) {
    return <EmptyNote>Bu mentorlukta henüz görüşme yok.</EmptyNote>;
  }
  return (
    <ul className="divide-y divide-[#eef0f2] rounded-2xl border border-[#e9ecef] px-4">
      {detail.meetings.map((meeting) => (
        <li key={meeting.id} className="flex items-center gap-3 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] text-[#22262b]">
              {meeting.title}
            </span>
            <span className="block text-[12px] text-[#858c96]">
              {meeting.scheduledAt
                ? formatDateTime(meeting.scheduledAt)
                : "Tarih yok"}
            </span>
          </span>
          {meeting.status === MeetingStatus.Cancelled ? (
            <StatusChip tone="neutral">İptal</StatusChip>
          ) : meeting.status === MeetingStatus.Scheduled &&
            meeting.scheduledAt &&
            new Date(meeting.scheduledAt) > new Date() ? (
            <StatusChip tone="blue">Planlandı</StatusChip>
          ) : meeting.hasNotes ? (
            <StatusChip tone="green">Not var</StatusChip>
          ) : (
            <StatusChip tone="amber">Not eksik</StatusChip>
          )}
        </li>
      ))}
    </ul>
  );
}

function ProgressTab({ detail }: { detail: CoordinatorMentorshipDetail }) {
  const row = detail.mentorship;
  return (
    <div className="space-y-6">
      <Section title="Görev ilerlemesi">
        <GoalProgress detail={detail} />
      </Section>
      <Section title="Aksiyonlar">
        <dl className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Açık" value={row.openActions} />
          <Stat label="Gecikmiş" value={row.overdueActions} />
          <Stat label="Notu eksik görüşme" value={row.missingNotes} />
        </dl>
      </Section>
      <Section title="Program kuralları">
        <p className="text-[13px] text-[#676e78]">
          Hedef: {detail.meetingFrequencyDays} günde bir görüşme ·{" "}
          {detail.staleAfterDays} gün görüşme olmazsa riskli sayılır.
        </p>
      </Section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#f7f8f9] px-3 py-3">
      <dt className="text-[12px] text-[#858c96]">{label}</dt>
      <dd className="mt-1 text-[20px] font-semibold text-[#22262b]">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-[11.5px] font-medium uppercase tracking-[0.04em] text-[#858c96]">
        {title}
      </h3>
      {children}
    </section>
  );
}
