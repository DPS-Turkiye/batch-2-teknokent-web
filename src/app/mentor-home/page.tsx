"use client";

import Link from "next/link";
import { ClipboardList, Users } from "lucide-react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { useDemoSession } from "@/components/providers/session-provider";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { AppArea } from "@/types/app-area";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function MentorHomePage() {
  const session = useDemoSession();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const requests = requestsQuery.data ?? [];

  const pending = requests.filter(
    (request) => request.status === MentorshipRequestStatus.Pending,
  );
  const accepted = requests.filter(
    (request) => request.status === MentorshipRequestStatus.Accepted,
  );

  return (
    <AppShell active={AppArea.MentorHome}>
      <div className="mx-auto w-full max-w-[1208px] space-y-6 px-4 pb-6 pt-8 sm:px-8 sm:pt-14">
        <section className="flex min-h-44 flex-col justify-between gap-8 rounded-[24px] bg-[#27272a] p-6 text-white sm:h-[181px] sm:flex-row sm:items-start">
          <div>
            <span className="inline-block rounded-md bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
              Mentor Paneli — DPS Mentor Experience
            </span>
            <h1 className="mt-2 text-2xl font-semibold">
              Hoş geldin, {session?.fullName ?? "Mentor"}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/90">
              Girişimcilerden gelen destek taleplerini buradan takip edin, kabul
              ettiğiniz mentorlukların sürecini görüntüleyin.
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-white/5 p-4 text-center sm:text-right">
            <p className="text-xs text-zinc-400">Bekleyen Talepler</p>
            <p className="text-3xl font-black text-amber-400">
              {pending.length}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6a7282]">
              <ClipboardList
                className="size-4"
                strokeWidth={1.75}
                aria-hidden
              />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Gelen Mentorluk Talepleri
              </h2>
              <p className="mt-1 text-xs text-[#6a7282]">
                {pending.length > 0
                  ? `${pending.length} talep yanıtınızı bekliyor.`
                  : "Bekleyen talep bulunmuyor."}
              </p>
            </div>
          </div>
          <PrimaryButton href="/mentor-dashboard" className="shrink-0">
            Talepleri İncele →
          </PrimaryButton>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#99a1af]">
              Aktif Mentorluklar
            </h2>
            <Link
              href="/mentor-dashboard"
              className="text-xs text-[#6a7282] underline underline-offset-2"
            >
              Tümünü gör
            </Link>
          </div>

          {requestsQuery.isLoading ? (
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#6a7282]">
              Yükleniyor...
            </div>
          ) : accepted.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-6 text-sm text-[#6a7282]">
              <Users
                className="size-4 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              Henüz kabul edilmiş bir mentorluk talebiniz yok.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {accepted.map((request) => (
                <Link
                  key={request.id}
                  href={`/mentor-dashboard/mentorship/${encodeURIComponent(request.id)}`}
                  className="flex items-start gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 transition hover:border-[#c7c7cc]"
                >
                  <Avatar
                    initials={
                      initials(
                        request.organizationName ?? request.requesterName ?? "",
                      ) || "MN"
                    }
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#171717]">
                      {request.organizationName ?? request.requesterName}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6a7282]">
                      {request.supportArea}
                    </p>
                    <div className="mt-2">
                      <Badge tone="green">Kabul Edildi</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#171717]">
            Mentor profiliniz
          </h2>
          <p className="mt-1 text-xs text-[#6a7282]">
            Uzmanlık alanlarınızı ve müsaitlik bilgilerinizi güncel tutarak daha
            uygun taleplerle eşleşin.
          </p>
          <SecondaryButton href="/mentor-profile" className="mt-3">
            Profili Görüntüle
          </SecondaryButton>
        </section>
      </div>
    </AppShell>
  );
}
