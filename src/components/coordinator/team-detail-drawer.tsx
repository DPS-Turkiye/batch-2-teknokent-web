"use client";

import { Copy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";

import {
  Avatar,
  EmptyNote,
  QueryNotice,
  StatusChip,
} from "@/components/admin/admin-ui";
import { useProgramTeamDetail } from "@/hooks/use-program-team-detail";
import { mentorshipHref } from "@/lib/coordinator-calendar";
import {
  coordinatorTeamMessageHref,
  HEALTH_LABELS,
  HEALTH_TONES,
} from "@/lib/coordinator-mentorships";
import { formatDateTime, formatShortDate, initials } from "@/lib/utils";

export function TeamDetailDrawer({
  programId,
  organizationId,
  onCopyCode,
  onClose,
}: {
  programId: string;
  organizationId: string;
  onCopyCode: (code: string) => void;
  onClose: () => void;
}) {
  const query = useProgramTeamDetail(programId, organizationId);
  const team = query.data;
  const messageHref = coordinatorTeamMessageHref(programId, organizationId);
  const mentorship = team?.mentorships[0] ?? null;

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
        aria-label="Takım detayı"
        className="relative m-3 flex w-full max-w-[600px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(33,38,43,0.18)]"
      >
        <header className="flex items-start gap-3 border-b border-[#eef0f2] px-7 py-6">
          {team ? <Avatar initials={initials(team.name)} size="lg" /> : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-semibold text-[#22262b]">
              {team?.name ?? "Takım"}
            </h2>
            {team?.sector ? (
              <p className="mt-1 text-[12.5px] text-[#858c96]">{team.sector}</p>
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
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-7 py-6">
          <QueryNotice isLoading={query.isLoading} error={query.error} />
          {team ? (
            <>
              <Section title="Takım yetkilisi">
                {team.lead ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-[#fff1ea] p-4">
                    <Avatar initials={initials(team.lead.name)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[#22262b]">
                        {team.lead.name}{" "}
                        <span className="ml-1 text-[12px] text-[#e5484d]">
                          Takım Yetkilisi
                        </span>
                      </p>
                      <p className="truncate text-[12.5px] text-[#676e78]">
                        {[team.lead.jobTitle, team.lead.email]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Link
                      href={messageHref}
                      className="rounded-full bg-white px-4 py-2 text-[12.5px] font-medium text-[#22262b]"
                    >
                      Mesaj
                    </Link>
                  </div>
                ) : (
                  <EmptyNote>Yetkili bilgisi yok.</EmptyNote>
                )}
              </Section>

              {team.code ? (
                <Section
                  title="Takım kodu"
                  hint="Yetkili bu kodu ekip üyeleriyle paylaşır"
                >
                  <div className="flex items-center justify-between rounded-2xl border border-[#e9ecef] p-4">
                    <div>
                      <p className="text-[17px] font-semibold text-[#22262b]">
                        {team.code}
                      </p>
                      <p className="text-[12.5px] text-[#1f9254]">
                        {team.members.length} üye katıldı
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopyCode(team.code as string)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e9ecef] px-4 py-2 text-[12.5px] font-medium text-[#22262b]"
                    >
                      <Copy aria-hidden className="size-3.5" /> Kopyala
                    </button>
                  </div>
                </Section>
              ) : null}

              <Section title={`Ekip üyeleri · ${team.members.length}`}>
                {team.members.length === 0 ? (
                  <EmptyNote>Henüz katılan üye yok.</EmptyNote>
                ) : (
                  <ul className="divide-y divide-[#f0f2f4] rounded-2xl border border-[#e9ecef]">
                    {team.members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <Avatar initials={initials(member.name)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] text-[#22262b]">
                            {member.name}
                          </p>
                          {member.jobTitle ? (
                            <p className="text-[12px] text-[#858c96]">
                              {member.jobTitle}
                            </p>
                          ) : null}
                        </div>
                        {member.joinedAt ? (
                          <span className="text-[12px] text-[#858c96]">
                            Katıldı · {formatShortDate(member.joinedAt)}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Mentorluk">
                {team.mentorships.length === 0 ? (
                  <EmptyNote>Bu takım henüz bir mentorla eşleşmedi.</EmptyNote>
                ) : (
                  <ul className="space-y-3">
                    {team.mentorships.map((row) => (
                      <li key={row.id} className="rounded-2xl bg-[#f7f8f9] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[14px] font-medium text-[#22262b]">
                              {row.mentorName} ↔ {team.name}
                            </p>
                            {row.topic ? (
                              <p className="text-[12.5px] text-[#676e78]">
                                {row.topic}
                              </p>
                            ) : null}
                          </div>
                          <StatusChip tone={HEALTH_TONES[row.health]}>
                            {HEALTH_LABELS[row.health]}
                          </StatusChip>
                        </div>
                        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-[13px] text-[#22262b]">
                          {row.nextMeetingAt
                            ? `Sıradaki görüşme: ${formatDateTime(row.nextMeetingAt)}`
                            : "Planlı görüşme yok"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-[#eef0f2] px-7 py-4">
          {mentorship ? (
            <Link
              href={mentorshipHref(mentorship.id)}
              className="text-[13px] font-medium text-[#22262b]"
            >
              Mentorluğu aç →
            </Link>
          ) : (
            <span />
          )}
          <Link
            href={messageHref}
            className="rounded-full bg-[#22262b] px-4 py-2.5 text-[13px] font-medium text-white"
          >
            Takıma mesaj gönder
          </Link>
        </footer>
      </section>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-[#676e78]">
          {title}
        </h3>
        {hint ? (
          <span className="text-[12px] text-[#858c96]">{hint}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
