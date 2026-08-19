"use client";

import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { Card } from "@/components/product-view-shared";
import { MENTORSHIP_DETAIL_TABS } from "@/lib/const";
import { AppArea } from "@/types/app-area";
import { MentorshipDetailTab } from "@/types/mentorship";

export default function MentorshipDetailPage() {
  const [tab, setTab] = useState(MentorshipDetailTab.Overview);
  const activeTabLabel =
    MENTORSHIP_DETAIL_TABS.find((item) => item.id === tab)?.label ?? "";

  return (
    <AppShell
      active={AppArea.Mentorships}
      title="Mentorluk Süreci"
      backHref="/dashboard"
      actions={<PrimaryButton disabled>+ Toplantı Planla</PrimaryButton>}
    >
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        <section className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 sm:flex-row sm:items-center">
          <Avatar initials="DK" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">
              Kullanıcı Araştırması &amp; Test
            </h2>
            <p className="mt-1 text-sm text-[#777]">
              Dr. Kemal Arslan · Trendyol
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#aaa]">
              <Badge>Devam Ediyor</Badge>
              <span>Başlangıç: 5 Ağustos 2024</span>
              <span>· Sonraki: 12 Ağustos 14:00</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium">Mentorluk Hedefi</p>
            <p className="mt-1 text-xs text-[#777]">
              Uygulanabilir kullanıcı testi planı oluşturmak
            </p>
          </div>
        </section>
        <div className="mt-4 flex gap-1 overflow-x-auto border-b border-[#e5e7eb]">
          {MENTORSHIP_DETAIL_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm ${tab === id ? "border-[#555] text-[#444]" : "border-transparent text-[#777]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === MentorshipDetailTab.Overview ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_288px]">
            <div className="space-y-4">
              <Card title="Süreç Durumu">
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-[#eee]">
                    <div className="h-full w-[35%] rounded-full bg-[#777]" />
                  </div>
                  <strong>%35</strong>
                </div>
                <p className="mt-3 text-xs text-[#aaa]">
                  2/3 toplantı tamamlandı · 5 aksiyon açık
                </p>
              </Card>
              <Card title="Son Görüşme Özeti">
                <p className="leading-6">
                  Kullanıcı segmentleri ve test senaryoları üzerine çalışıldı.
                  Primer kullanıcı grubu olarak “Hekim asistanları” belirlendi.
                  Bir sonraki adımda 5 kişilik pilot grup ile görüşme yapılacak.
                </p>
                <p className="mt-3 text-xs text-[#aaa]">5 Ağustos 2024</p>
              </Card>
              <Card title="Bir Sonraki Adım">
                <p>
                  Pilot kullanıcı görüşmeleri için soru seti hazırla ve 12
                  Ağustos toplantısına getir.
                </p>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Açık Risk">
                <p>
                  Demo video hazırlığı gecikiyor. Bir sonraki toplantıdan önce
                  tamamlanmalı.
                </p>
              </Card>
              <Card title="Mentor İletişimi">
                <p className="text-xs text-[#888]">Son mesaj: 7 Ağustos</p>
                <textarea
                  placeholder="Mentora kısa not gönder..."
                  className="mt-3 min-h-20 w-full rounded-md border border-[#e5e7eb] p-3 text-sm"
                />
                <SecondaryButton className="mt-2">Gönder</SecondaryButton>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-white p-8 text-center text-sm text-[#777]">
            {activeTabLabel} görünümü backend bağlantısı için hazır.
          </div>
        )}
      </div>
    </AppShell>
  );
}
