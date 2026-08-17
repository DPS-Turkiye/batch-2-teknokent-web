"use client";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Avatar } from "@/components/common/avatar";
import { Card, Info, Person } from "@/components/product-view-shared";
import { AppArea } from "@/types/app-area";

export default function MeetingDetailPage() {
  return (
    <AppShell
      active={AppArea.Meetings}
      title="Toplantı Detayı"
      backHref="/dashboard"
      actions={<PrimaryButton>▣ Toplantıya Katıl</PrimaryButton>}
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar initials="DK" />
            <div className="flex-1">
              <h2 className="text-sm font-semibold">Dr. Kemal Arslan</h2>
              <p className="mt-1 text-xs text-[#777]">
                Ürün & Araştırma Direktörü · Trendyol
              </p>
            </div>
            <Badge>Online</Badge>
          </div>
          <dl className="mt-4 grid gap-4 border-t border-[#eee] pt-4 text-sm sm:grid-cols-3">
            <Info label="Tarih & Saat" value="Pzt, 12 Ağustos · 14:00" />
            <Info label="Süre" value="60 dakika" />
            <Info label="Toplantı Linki" value="Linki Aç" />
          </dl>
        </section>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card title="Toplantının Amacı">
              <p>Kullanıcı testi yöntemi ve segmentasyon belirleme</p>
              <p className="mt-2 text-xs text-[#aaa]">
                Beklenen çıktı: Uygulanabilir kullanıcı testi planı
              </p>
            </Card>
            <Card title="Katılacak Ekip Üyeleri">
              <Person initials="AK" name="Ayşe Kaya (CEO)" />
              <Person initials="BŞ" name="Burak Şahin (CTO)" />
            </Card>
            <Card title="Paylaşılan Dosyalar">
              <p>▱ Pitch Deck v3.pdf</p>
              <p className="mt-2 text-[#999]">△ Ürün demosu eksik</p>
              <button className="mt-3 text-xs" type="button">
                Dosya ekle →
              </button>
            </Card>
          </div>
          <div className="space-y-4">
            <Card title="Hazırlık Durumu">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-[#eee]">
                  <div className="h-full w-2/5 rounded-full bg-[#777]" />
                </div>
                <span>2/5</span>
              </div>
              <SecondaryButton
                href="/meetings/research/prepare"
                className="mt-3 border-0 px-0"
              >
                Hazırlığa devam et →
              </SecondaryButton>
            </Card>
            <Card title="Önceki Toplantı Özeti">
              <p className="italic text-[#888]">
                İlk toplantı — özet henüz yok
              </p>
            </Card>
            <Card title="Açık Aksiyonlar">
              <ul className="space-y-2">
                <li>• Kullanıcı segmentini tanımla</li>
                <li>• Test soruları hazırla</li>
                <li>• Demo videosunu hazırla</li>
              </ul>
            </Card>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SecondaryButton disabled>Yeniden Planla</SecondaryButton>
          <SecondaryButton>Mentora Not Gönder</SecondaryButton>
          <SecondaryButton>Toplantıyı İptal Et</SecondaryButton>
        </div>
      </div>
    </AppShell>
  );
}
