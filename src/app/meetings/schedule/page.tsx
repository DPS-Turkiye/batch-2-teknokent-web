"use client";

import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { AppArea } from "@/types/app-area";
import { MEETING_SCHEDULE_DAYS, MEETING_SCHEDULE_FILTERS } from "@/lib/const";

export default function ScheduleMeetingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <AppShell
      active={AppArea.Calendar}
      title="Toplantı Planla"
      backHref="/mentor-request/status?state=accepted"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <Avatar initials="DK" size="sm" />
          <span className="text-sm">Dr. Kemal Arslan</span>
          <span>·</span>
          <span className="text-sm">Kullanıcı testi</span>
          <span>·</span>
          <Badge>Online</Badge>
        </section>
        <div className="mt-5 flex flex-wrap gap-2">
          {MEETING_SCHEDULE_FILTERS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`rounded-full border px-4 py-2 text-xs ${index === 0 ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <h2 className="mt-5 text-xs font-semibold text-[#777]">
          Ortak müsait zamanlar — Ağustos 2024
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {MEETING_SCHEDULE_DAYS.map(([day, ...slots]) => (
            <div key={day}>
              <h3 className="mb-2 text-center text-xs text-[#777]">{day}</h3>
              <div className="space-y-2">
                {slots.map((slot) => {
                  const value = `${day} ${slot}`;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelected(value)}
                      className={`h-9 w-full rounded-md border text-xs ${selected === value ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white"}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {selected ? (
          <section className="mt-6 rounded-lg border border-[#e5e7eb] bg-white p-5">
            <h2 className="text-sm font-semibold">Toplantı Özeti</h2>
            <p className="mt-3 text-sm">Tarih: {selected}</p>
            <p className="mt-1 text-sm">Süre: 60 dakika</p>
            <p className="mt-1 text-sm">Biçim: Online</p>
            <p className="mt-3 text-xs text-[#888]">
              Toplantı linki onaydan sonra oluşturulacaktır.
            </p>
            <PrimaryButton href="/meetings/research" className="mt-4">
              Toplantıyı Planla
            </PrimaryButton>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
