"use client";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Info } from "@/components/product-view-shared";

export default function RequestSentPage() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-xl flex-col items-center px-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-[#f0f0f0] text-2xl text-[#666]">
          ✓
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-[#171717]">
          Mentorluk talebiniz gönderildi
        </h1>
        <p className="mt-2 text-sm text-[#777]">
          Mentor talebinizi değerlendirdiğinde size bildirim göndereceğiz.
        </p>
        <dl className="mt-7 grid w-full grid-cols-2 gap-5 rounded-lg border border-[#e5e7eb] bg-white p-5 text-left text-sm">
          <Info label="Mentor" value="Dr. Kemal Arslan" />
          <Info label="Talep konusu" value="Kullanıcı testi" />
          <Info label="Gönderilme tarihi" value="9 Ağustos 2024" />
          <Info label="Beklenen yanıt süresi" value="~24 saat" />
          <Info label="Talep durumu" value="Yanıt bekleniyor" />
        </dl>
        <div className="mt-6 grid w-full gap-2">
          <PrimaryButton href="/mentor-request/status" className="w-full">
            Talep Detaylarını Gör
          </PrimaryButton>
          <SecondaryButton disabled className="w-full">
            Alternatif Mentorları İncele
          </SecondaryButton>
          <SecondaryButton
            href="/dashboard"
            className="w-full border-0 bg-transparent"
          >
            Ana Sayfaya Dön
          </SecondaryButton>
        </div>
        <button type="button" className="mt-6 text-xs text-[#aaa]">
          Fikrinizi değiştirdiniz mi?{" "}
          <span className="text-[#555]">Talebi geri çek</span>
        </button>
      </div>
    </AppShell>
  );
}
