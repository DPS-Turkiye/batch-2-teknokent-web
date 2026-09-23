"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ApplicationStatusTimeline } from "@/components/auth/application-status-timeline";
import { AuthShell } from "@/components/auth/auth-shell";
import { SubmittedProfileSummary } from "@/components/auth/submitted-profile-summary";
import { useAccountStatus } from "@/hooks/use-account-status";
import { UserAccountStatus } from "@/interfaces/session";

const STATUS_LABEL: Record<UserAccountStatus, string> = {
  [UserAccountStatus.Pending]: "Koordinatör incelemesinde",
  [UserAccountStatus.Approved]: "Onaylandı",
  [UserAccountStatus.Rejected]: "Onaylanmadı",
};

export default function ApplicationStatusPage() {
  const { account, isLoading, isSignedOut } = useAccountStatus();

  if (isLoading) {
    return (
      <AuthShell>
        <p className="py-12 text-center text-sm text-[#676e78]">
          Yükleniyor...
        </p>
      </AuthShell>
    );
  }

  if (isSignedOut || !account) {
    return (
      <AuthShell>
        <div className="space-y-4 py-10 text-center">
          <h1 className="text-xl font-bold text-[#22262b]">
            Başvuru durumunu görmek için giriş yap
          </h1>
          <p className="text-sm text-[#676e78]">
            Durumunu görüntüleyebilmemiz için hesabınla yeniden giriş yapman
            gerekiyor.
          </p>
          <Link
            href="/login"
            className="inline-flex rounded-xl bg-[#e86f22] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c85816]"
          >
            Giriş yap
          </Link>
        </div>
      </AuthShell>
    );
  }

  const status = account.status ?? UserAccountStatus.Pending;
  const displayName = account.organizationName || account.fullName;

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-[620px] space-y-5 py-6">
        <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#f1f2f4] text-sm font-bold text-[#858c96]">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-semibold">{displayName}</h1>
                <span className="rounded-full bg-[#fdebdd] px-2.5 py-1 text-[11px] font-semibold text-[#c85816]">
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#858c96]">{account.email}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#a4aab2]">
            Süreç
          </h2>
          <ApplicationStatusTimeline status={status} />
        </section>

        <SubmittedProfileSummary organizationName={account.organizationName} />

        {status === UserAccountStatus.Approved ? (
          <Link
            href="/login"
            className="inline-flex rounded-xl bg-[#e86f22] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c85816]"
          >
            Giriş yap
          </Link>
        ) : null}

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-[#e86f22] hover:text-[#c85816]"
        >
          <ArrowLeft className="size-3.5" />
          Ana sayfaya dön
        </Link>
      </div>
    </AuthShell>
  );
}
