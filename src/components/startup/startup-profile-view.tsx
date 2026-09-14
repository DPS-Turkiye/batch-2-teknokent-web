"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  StartupPageFrame,
  startupSecondaryActionClass,
} from "@/components/startup/startup-page-frame";
import { StartupStatusDialog } from "@/components/startup/startup-status-dialog";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import { useStartupStatusForm } from "@/hooks/use-startup-status-form";
import type { ActiveMentorshipRow } from "@/lib/startup-overview";
import { formatDayMonth, formatLongDate, initials } from "@/lib/utils";

const cardClass =
  "space-y-3.5 rounded-[24px] border border-[#e4e7ea] bg-white px-[22px] py-5";
const cardTitleClass =
  "text-[15px] font-semibold leading-[23px] text-[#22262b]";
const cardHintClass = "text-[12.5px] leading-[19px] text-[#676e78]";
const cardLinkClass =
  "shrink-0 text-[12.5px] font-medium leading-[19px] text-[#c95c18] hover:underline";
const bodyClass = "text-[13px] leading-5 text-[#4a5059]";
const chipClass =
  "rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-[17px]";

function Card({
  id,
  title,
  hint,
  action,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cardClass}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id={id} className={cardTitleClass}>
            {title}
          </h2>
          {hint ? <p className={cardHintClass}>{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function sessionsLabel(row: ActiveMentorshipRow) {
  const sessions =
    row.plannedSessions != null
      ? `${row.heldSessions} / ${row.plannedSessions} seans`
      : `${row.heldSessions} seans`;
  const next = row.nextMeetingAt
    ? `sonraki ${formatDayMonth(new Date(row.nextMeetingAt))}`
    : null;
  return [row.supportArea, sessions, next].filter(Boolean).join(" · ");
}

export function StartupProfileView() {
  const overview = useStartupOverview();
  const statusForm = useStartupStatusForm(overview.profile);
  const openDocument = useOpenDocument();

  const editAction = (
    <Link href="/profile" className={startupSecondaryActionClass}>
      Profili düzenle
    </Link>
  );

  if (overview.isLoading) {
    return (
      <StartupPageFrame action={editAction}>
        <p className="py-10 text-sm text-[#858c96]">
          Startup profili yükleniyor…
        </p>
      </StartupPageFrame>
    );
  }
  if (!overview.profile) {
    return (
      <StartupPageFrame>
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {overview.error?.message ?? "Startup profili bulunamadı."}
        </p>
      </StartupPageFrame>
    );
  }

  const { canvas, profile } = overview;
  const percent = profile.completionPercent;
  const facts: [string, string | null][] = [
    [
      "Kuruluş",
      profile.foundedYear != null ? String(profile.foundedYear) : null,
    ],
    [
      "Aşama",
      [overview.stageName, profile.fundingStage].filter(Boolean).join(" · ") ||
        null,
    ],
    ["Sektör", profile.sector],
    ["Program", overview.programName],
    ["Web", profile.website],
    ["Ekip", overview.teamSize != null ? `${overview.teamSize} kişi` : null],
  ];

  return (
    <StartupPageFrame action={editAction}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-[18px]">
          <Card
            id="startup-about"
            title="Startup hakkında"
            hint="Mentorlar seni mentor havuzunda bu metinle görüyor."
            action={
              <Link href="/profile" className={cardLinkClass}>
                Düzenle
              </Link>
            }
          >
            <p className={bodyClass}>
              {profile.description ?? "Henüz bir tanıtım yazısı eklenmedi."}
            </p>
          </Card>

          <Card
            id="startup-status"
            title="Ürün durumu"
            action={
              <button
                type="button"
                onClick={statusForm.open}
                className={cardLinkClass}
              >
                Güncelle
              </button>
            }
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`${chipClass} border-[#f6c9a5] bg-[#fff4ec] text-[#c95c18]`}
              >
                {profile.maturity ?? "Aşama belirtilmedi"}
              </span>
              <span className={cardHintClass}>
                {[
                  profile.statusVersion,
                  `son güncelleme ${formatLongDate(profile.updatedAt)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <p className={bodyClass}>
              {profile.statusSummary ??
                "Henüz bir durum güncellemesi eklenmedi."}
            </p>
            {percent != null ? (
              <>
                <div
                  role="progressbar"
                  aria-label="Tamamlanma oranı"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  className="h-1.5 overflow-hidden rounded-full bg-[#eceef0]"
                >
                  <div
                    className="h-full rounded-full bg-[#e86f22]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-xs leading-[18px] text-[#676e78]">
                    Tamamlanma
                  </span>
                  <span className="text-[12.5px] font-medium leading-[19px] text-[#c95c18]">
                    %{percent}
                  </span>
                </div>
              </>
            ) : null}
          </Card>

          <Card
            id="startup-canvas"
            title="Business Model Canvas"
            hint="İş modelini tek sayfada özetleyen çalışma dosyan."
            action={
              canvas ? (
                <button
                  type="button"
                  onClick={() => void openDocument(canvas.id)}
                  className={cardLinkClass}
                >
                  Görüntüle
                </button>
              ) : null
            }
          >
            {canvas ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e7ea] px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Image
                    src="/startup/paper.svg"
                    alt=""
                    width={17}
                    height={17}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
                      {canvas.originalFilename}
                    </p>
                    <p className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                      {[
                        `Son güncelleme ${formatLongDate(canvas.createdAt)}`,
                        canvas.uploadedByName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <span
                  className={`${chipClass} shrink-0 border-[#cbebda] bg-[#eefaf3] text-[#0f7a4d]`}
                >
                  Güncel
                </span>
              </div>
            ) : (
              <p className="text-sm text-[#858c96]">
                {overview.documentsLoading
                  ? "Dosyalar yükleniyor…"
                  : "Henüz bir kanvas yüklenmedi."}
              </p>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-[18px]">
          <Card id="startup-facts" title="Künye">
            <dl className="space-y-3.5">
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4"
                >
                  <dt className="text-xs leading-[18px] text-[#676e78]">
                    {label}
                  </dt>
                  <dd className="text-right text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
                    {value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card
            id="startup-mentorships"
            title="Aktif mentorlukların"
            hint="Mentorluk detayları Mentorluklarım altında."
            action={
              <Link href="/mentorships" className={cardLinkClass}>
                Mentorluklarım →
              </Link>
            }
          >
            {overview.mentorshipsLoading ? (
              <p className="text-sm text-[#858c96]">Mentorluklar yükleniyor…</p>
            ) : overview.mentorships.length === 0 ? (
              <p className="text-sm text-[#858c96]">
                Henüz aktif bir mentorluğun yok.
              </p>
            ) : (
              <ul className="space-y-3.5">
                {overview.mentorships.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-2.5 rounded-lg border border-[#e4e7ea] px-3 py-2.5"
                  >
                    <span
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-[11px] font-semibold text-[#c95c18]"
                    >
                      {initials(row.mentorName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
                        {row.mentorName}
                      </p>
                      <p className="text-[11.5px] leading-[17px] text-[#676e78]">
                        {sessionsLabel(row)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <StartupStatusDialog form={statusForm} />
    </StartupPageFrame>
  );
}
