"use client";

import {
  ArrowLeft,
  Check,
  FileText,
  Lock,
  Mail,
  PencilLine,
} from "lucide-react";
import Link from "next/link";

import { ApplicationStatusTimeline } from "@/components/auth/application-status-timeline";
import type { SignupDraft } from "@/interfaces/signup";
import { UserAccountStatus } from "@/interfaces/session";

const nextUp = [
  {
    icon: Check,
    text: "Koordinatör profili onaylarsa startup’ın METUal’da aktif olur ve mentor eşleşmesi başlar.",
  },
  {
    icon: PencilLine,
    text: "Düzenleme talebi gelirse e-posta ile bilgilendirilirsin. Talep edilen alanlar için profil düzenleme açılır.",
  },
  {
    icon: Mail,
    text: "Sorular için doğrudan info@metu.edu.tr adresine yazabilirsin.",
  },
];

export function SubmittedView({ draft }: { draft: SignupDraft }) {
  const startupName = draft.startup.name || "Startup’ın";

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-5">
      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f1f2f4] text-sm font-bold text-[#858c96]">
            {startupName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-semibold">{startupName}</h1>
              <span className="rounded-full bg-[#fdebdd] px-2.5 py-1 text-[11px] font-semibold text-[#c85816]">
                Koordinatör incelemesinde
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#858c96]">
              Profilin koordinatöre iletildi.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#a4aab2]">
          Süreç
        </h2>
        <ApplicationStatusTimeline status={UserAccountStatus.Pending} />
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#a4aab2]">
          Sırada ne var?
        </h2>
        <ul className="mt-4 space-y-3">
          {nextUp.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3">
              <Icon
                className="mt-0.5 size-4 shrink-0 text-[#858c96]"
                strokeWidth={1.8}
              />
              <span className="text-xs leading-relaxed text-[#3c424a]">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="flex items-start gap-2.5 rounded-2xl bg-[#f1f2f4] p-4 text-xs leading-relaxed text-[#676e78]">
        <Lock className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
        İnceleme sürecinde profilde büyük değişiklik yapılamaz. Koordinatör onay
        verdiğinde veya düzenleme talep ettiğinde profil yeniden düzenlenebilir
        hale gelir.
      </p>

      <Link
        href="/application-status"
        className="inline-flex rounded-xl bg-[#e86f22] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c85816]"
      >
        Başvuru durumunu görüntüle
      </Link>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-[#e86f22] hover:text-[#c85816]"
      >
        <ArrowLeft className="size-3.5" />
        Ana sayfaya dön
      </Link>

      {draft.personal.cv ? (
        <p className="flex items-center gap-2 px-1 text-[11px] text-[#a4aab2]">
          <FileText className="size-3.5" />
          {draft.personal.cv.name} ile birlikte gönderildi
        </p>
      ) : null}
    </div>
  );
}
