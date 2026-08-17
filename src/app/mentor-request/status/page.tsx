"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { AcceptedRequestCalendar } from "@/components/product-view-shared";
import { MENTOR_REQUEST_STATUS_OPTIONS } from "@/lib/const";

export default function RequestStatusPage() {
  const params = useSearchParams();
  const requestedState = params.get("state") ?? "waiting";
  const validIds = MENTOR_REQUEST_STATUS_OPTIONS.map(([id]) => id);
  const initial = validIds.includes(requestedState as (typeof validIds)[number])
    ? requestedState
    : "waiting";
  const [state, setState] = useState(initial);
  return (
    <AppShell title="Talep Detayı" backHref="/dashboard">
      <div className="mx-auto max-w-[736px] px-4 py-6 sm:px-8">
        <div className="flex gap-2 overflow-x-auto">
          {MENTOR_REQUEST_STATUS_OPTIONS.map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={state === id}
              onClick={() => setState(id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs ${state === id ? "border-[#555] bg-[#555] font-medium text-white" : "border-[#e5e7eb] bg-white text-[#555]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <section className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar initials="DK" />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Dr. Kemal Arslan</h2>
              <p className="mt-1 text-xs text-[#777]">
                Kullanıcı testi · Gönderildi: 9 Ağustos 2024
              </p>
            </div>
            <Badge
              tone={
                state === "accepted"
                  ? "green"
                  : state === "declined"
                    ? "gray"
                    : "amber"
              }
            >
              {MENTOR_REQUEST_STATUS_OPTIONS.find(([id]) => id === state)?.[1]}
            </Badge>
          </div>
        </section>
        <section className="mt-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div>
            {state === "waiting" ? (
              <div>
                <h3 className="text-lg font-semibold">Yanıt bekleniyor</h3>
                <p className="mt-2 text-sm text-[#777]">
                  Beklenen yanıt süresi: ~24 saat
                </p>
                <p className="mt-1 text-xs text-[#aaa]">
                  Gönderim: 9 Ağustos 2024 · 14:32
                </p>
              </div>
            ) : null}
            {state === "question" ? (
              <div>
                <Badge tone="amber">Ek bilgi istendi</Badge>
                <p className="mt-4 text-sm font-semibold">Mentorun sorusu:</p>
                <blockquote className="mt-2 rounded-md bg-[#f9fafb] p-4 text-sm italic leading-6 text-[#555]">
                  “Şu ana kadar herhangi bir kullanıcı görüşmesi yaptınız mı?
                  Varsa bulguları paylaşabilir misiniz?”
                </blockquote>
                <textarea
                  placeholder="Yanıtınızı yazın…"
                  className="mt-4 min-h-28 w-full rounded-md border border-[#e5e7eb] p-3 text-sm"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <SecondaryButton>Dosya Ekle</SecondaryButton>
                  <PrimaryButton>Yanıtı Gönder</PrimaryButton>
                </div>
              </div>
            ) : null}
            {state === "accepted" ? <AcceptedRequestCalendar /> : null}
            {state === "declined" ? (
              <div>
                <h3 className="text-lg font-semibold">Uygun değil</h3>
                <p className="mt-3 text-sm text-[#777]">Neden uygun değil:</p>
                <p className="mt-1 text-sm">Bu dönemde müsait değilim</p>
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-4">
                  <Avatar initials="SÖ" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Selin Öztürk</h4>
                    <p className="mt-1 text-xs text-[#777]">
                      Kurucu · HealthTech Ventures
                    </p>
                  </div>
                  <PrimaryButton href="/mentor-request?step=4&exclude=Dr.%20Kemal%20Arslan">
                    Alternatif Mentora Talep Gönder
                  </PrimaryButton>
                </div>
              </div>
            ) : null}
          </div>
        </section>
        {state === "waiting" ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <SecondaryButton>Talebi Geri Çek</SecondaryButton>
            <SecondaryButton href="/mentors/compare">
              Alternatif Mentorları Görüntüle
            </SecondaryButton>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
