"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import { AppShell } from "@/components/hoc/app-shell";
import { MentorsDirectory } from "@/components/mentors/mentors-directory";
import { useMentorshipWorkspace } from "@/hooks/use-mentorship-workspace";
import {
  MENTORSHIPS_REQUEST_STATUS_LABELS,
  MENTORSHIPS_TABS,
} from "@/lib/const";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

export default function MentorshipsPage() {
  const { error, isLoading, query, requests, setQuery, setTab, tab } =
    useMentorshipWorkspace();

  return (
    <AppShell active={AppArea.Mentorships} title="Mentorluklarım">
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#e86f22]">
              Mentorluk alanın
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Mentorluklarım
            </h1>
            <p className="mt-2 text-sm text-[#676e78]">
              Mentorlarını keşfet, taleplerini izle ve aktif süreçlerini yönet.
            </p>
          </div>
          <Link
            href="/mentor-request"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white hover:bg-[#ce5e19]"
          >
            Yeni mentor talebi <ArrowRight className="size-4" />
          </Link>
        </div>

        <section className="mt-7 rounded-2xl border border-[#f2b78f] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <strong className="text-sm">Yeni bir mentor mu arıyorsun?</strong>
              <p className="mt-1 text-xs text-[#676e78]">
                İhtiyacını tanımla; sistem girişim profiline göre en uygun
                mentorları önersin.
              </p>
            </div>
            {tab === MentorshipWorkspaceTab.MentorPool ? (
              <Link
                href="/mentor-request"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#e86f22] px-4 text-xs font-semibold text-white hover:bg-[#ce5e19] sm:w-auto"
              >
                Eşleşmeyi başlat
              </Link>
            ) : (
              <label className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border border-[#e4e7ea] bg-[#f8f9fa] px-3 sm:w-80">
                <Search className="size-4 text-[#858c96]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Mentor veya konu ara…"
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                />
              </label>
            )}
          </div>
        </section>

        <div
          className="mt-4 grid grid-cols-4 border-b border-[#e4e7ea]"
          role="tablist"
          aria-label="Mentorluk görünümleri"
        >
          {MENTORSHIPS_TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={
                "border-b-2 px-2 py-3 text-xs font-semibold transition " +
                (tab === id
                  ? "border-[#e86f22] text-[#c85816]"
                  : "border-transparent text-[#858c96] hover:text-[#515861]")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {tab === MentorshipWorkspaceTab.MentorPool ? (
          <div className="mt-5">
            <MentorsDirectory embedded />
          </div>
        ) : isLoading ? (
          <div className="mt-5 rounded-2xl border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
            Yükleniyor...
          </div>
        ) : error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {error.message}
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#d6dade] bg-white p-12 text-center">
            <Sparkles className="mx-auto size-7 text-[#e86f22]" />
            <h2 className="mt-4 text-base font-semibold">
              Henüz bir mentorluk talebiniz yok.
            </h2>
            <p className="mt-1 text-sm text-[#676e78]">
              Bu görünümde gösterilecek bir süreç bulunmuyor.
            </p>
          </div>
        ) : (
          <section className="mt-5 grid gap-4 md:grid-cols-2">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={
                  "/mentor-request/status?id=" + encodeURIComponent(request.id)
                }
                className="rounded-2xl border border-[#e4e7ea] bg-white p-5 transition hover:border-[#f2b78f] hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    initials={initials(request.mentorName) || "MN"}
                    tone="orange"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold">
                      {request.mentorName}
                    </h2>
                    <p className="mt-1 truncate text-xs text-[#676e78]">
                      {request.supportArea}
                    </p>
                  </div>
                  <Badge>
                    {MENTORSHIPS_REQUEST_STATUS_LABELS[request.status]}
                  </Badge>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[#eef0f2] pt-4">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#858c96]">
                    <CalendarDays className="size-3.5" />
                    {new Intl.DateTimeFormat("tr-TR", {
                      dateStyle: "medium",
                    }).format(new Date(request.createdAt))}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c85816]">
                    Süreci aç <MessageCircle className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
