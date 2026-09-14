"use client";

import Image from "next/image";
import Link from "next/link";

import { Avatar } from "@/components/common/avatar";
import { StartupStatusDialog } from "@/components/startup/startup-status-dialog";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import { useStartupOverview } from "@/hooks/use-startup-overview";
import { useStartupStatusForm } from "@/hooks/use-startup-status-form";
import { formatLongDate, initials } from "@/lib/utils";

const cardClass = "rounded-[24px] border border-[#e4e7ea] bg-white p-6";
const headingClass = "text-base leading-6 text-[#22262b]";
const mutedClass = "text-sm text-[#858c96]";
const AVATAR_TONES = ["orange", "teal", "purple"] as const;

function FileIcon({ orange = false }: { orange?: boolean }) {
  return (
    <Image
      src={orange ? "/startup/file-orange.svg" : "/startup/file-gray.svg"}
      alt=""
      width={18}
      height={18}
    />
  );
}

export function StartupProfileView() {
  const overview = useStartupOverview();
  const statusForm = useStartupStatusForm(overview.profile);
  const openDocument = useOpenDocument();

  if (overview.isLoading) {
    return <p className={`py-10 ${mutedClass}`}>Startup profili yükleniyor…</p>;
  }
  if (!overview.profile) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {overview.error?.message ?? "Startup profili bulunamadı."}
      </p>
    );
  }

  const { canvas, profile } = overview;
  const percent = profile.completionPercent;

  return (
    <div className="grid gap-[26px] lg:grid-cols-[minmax(0,656fr)_minmax(0,365fr)]">
      <div className="min-w-0 space-y-3">
        <section
          aria-labelledby="startup-name"
          className={`${cardClass} flex gap-4`}
        >
          {overview.logoUrl ? (
            <span
              role="img"
              aria-label={`${profile.name} logosu`}
              className="size-12 shrink-0 rounded-lg border border-[#e4e7ea] bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${overview.logoUrl}")` }}
            />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-[#e4e7ea]">
              <Image
                src="/startup/logo-placeholder.svg"
                alt=""
                width={30}
                height={35}
              />
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1
                id="startup-name"
                className="text-xl uppercase leading-7 text-[#676e78]"
              >
                {profile.name}
              </h1>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#fbe2d0] px-3.5 py-[7px] text-[13px] text-[#676e78] transition hover:border-[#e86f22]"
              >
                <Image src="/startup/edit.svg" alt="" width={14} height={14} />
                Profili Düzenle
              </Link>
            </div>
            <p className="text-xs leading-4 text-[#22262b]">
              {profile.description ?? "Henüz bir tanıtım yazısı eklenmedi."}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="startup-status"
          className={`${cardClass} space-y-4`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="startup-status" className={headingClass}>
              Durum
            </h2>
            <button
              type="button"
              onClick={statusForm.open}
              className="text-xs text-[#e86f22] hover:underline"
            >
              Durumu güncelle
            </button>
          </div>
          <div className="space-y-3 rounded-xl border border-[#e86f22] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#e86f22] bg-[#fff4ec] px-2.5 py-[3px] text-[11.5px] text-[#e86f22]">
                {profile.maturity ?? "Aşama belirtilmedi"}
              </span>
              {profile.statusVersion ? (
                <span className="text-xs text-[#aeb4bc]">
                  {profile.statusVersion}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-5 text-[#676e78]">
              {profile.statusSummary ??
                "Henüz bir durum güncellemesi eklenmedi."}
            </p>
            {percent != null ? (
              <div className="space-y-1">
                <p className="text-right text-xs text-[#aeb4bc]">
                  %{percent} tamamlandı
                </p>
                <div
                  role="progressbar"
                  aria-label="Tamamlanma oranı"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  className="h-1.5 overflow-hidden rounded-full bg-[#fff4ec]"
                >
                  <div
                    className="h-full rounded-full bg-[#e86f22]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section
          aria-labelledby="startup-canvas"
          className={`${cardClass} space-y-4`}
        >
          <h2 id="startup-canvas" className={headingClass}>
            Canvas
          </h2>
          {canvas ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e86f22] p-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#fff4ec]">
                  <FileIcon orange />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#676e78]">
                    Business Model Canvas
                  </p>
                  <p className="text-xs text-[#aeb4bc]">
                    Son güncelleme: {formatLongDate(canvas.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void openDocument(canvas.id)}
                className="shrink-0 rounded-full border border-[#fff4ec] px-3 py-[5px] text-xs text-[#e86f22] transition hover:border-[#e86f22]"
              >
                Görüntüle
              </button>
            </div>
          ) : (
            <p className={mutedClass}>Henüz bir kanvas yüklenmedi.</p>
          )}
        </section>
      </div>

      <div className="min-w-0 space-y-3">
        <section
          aria-labelledby="startup-team"
          className={`${cardClass} space-y-4`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="startup-team" className={headingClass}>
              Ekip
            </h2>
            <Link
              href="/startup/team"
              className="rounded-full border border-[#fff4ec] px-3.5 py-1.5 text-[13px] text-[#e86f22] transition hover:border-[#e86f22]"
            >
              Ekibi Görüntüle →
            </Link>
          </div>
          {overview.teamLoading ? (
            <p className={mutedClass}>Ekip yükleniyor…</p>
          ) : overview.team.length === 0 ? (
            <p className={mutedClass}>Henüz ekip üyesi eklenmedi.</p>
          ) : (
            <ul className="space-y-2.5 px-2">
              {overview.team.map((member, index) => (
                <li key={member.id} className="flex items-center gap-2.5">
                  <Avatar
                    initials={initials(member.fullName) || "?"}
                    tone={AVATAR_TONES[index % AVATAR_TONES.length]}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#676e78]">
                      {member.fullName}
                    </p>
                    <p className="truncate text-xs text-[#aeb4bc]">
                      {[member.jobTitle, member.founder ? "Kurucu" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="startup-shared"
          className={`${cardClass} space-y-4`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="startup-shared" className={headingClass}>
              Mentorlarla Paylaşılan Dosyalar
            </h2>
            <Link
              href="/startup/files"
              className="shrink-0 rounded-full border border-[#fff4ec] px-3.5 py-1.5 text-[13px] text-[#e86f22] transition hover:border-[#e86f22]"
            >
              Tümünü Gör →
            </Link>
          </div>
          {overview.documentsLoading ? (
            <p className={mutedClass}>Dosyalar yükleniyor…</p>
          ) : overview.sharedDocuments.length === 0 ? (
            <p className={mutedClass}>
              Henüz mentorlarla paylaşılan bir dosya yok.
            </p>
          ) : (
            <ul className="space-y-2">
              {overview.sharedDocuments.map((document) => (
                <li key={document.id}>
                  <button
                    type="button"
                    onClick={() => void openDocument(document.id)}
                    className="flex w-full items-center gap-1 rounded-xl border border-[#e4e7ea] p-3 text-left text-xs text-[#858c96] transition hover:border-[#e86f22]"
                  >
                    <FileIcon />
                    <span className="truncate">
                      {document.originalFilename}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <StartupStatusDialog form={statusForm} />
    </div>
  );
}
