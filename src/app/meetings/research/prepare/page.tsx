"use client";

import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Badge } from "@/components/common/badge";
import { Card } from "@/components/product-view-shared";
import { MEETING_PREPARE_CHECKLIST } from "@/lib/const";
import { AppArea } from "@/types/app-area";

export default function MeetingPreparationPage() {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set([MEETING_PREPARE_CHECKLIST[0]]),
  );
  function toggle(label: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }
  return (
    <AppShell
      active={AppArea.Actions}
      title="Toplantıya hazırlanın"
      backHref="/meetings/research"
    >
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <h2 className="text-sm font-semibold">
            △ Toplantıya 10 saatten az kaldı
          </h2>
          <p className="mt-2 text-xs text-[#777]">
            {MEETING_PREPARE_CHECKLIST.length - checked.size} görev
            tamamlanmadı. Toplantı öncesinde hazırlığınızı tamamlamanız
            önerilir.
          </p>
        </section>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Card title="Toplantının Amacı">
              <p className="font-medium">
                Kullanıcı testi yöntemi ve segmentasyon
              </p>
              <p className="mt-2 leading-5 text-[#777]">
                MVP&apos;yi ilk kullanıcılarla test etmeye hazırlanıyoruz. Test
                yöntemini ve doğru kullanıcı grubunu belirlemekte zorlanıyoruz.
              </p>
              <p className="mt-2 text-xs text-[#aaa]">
                Beklenen çıktı: Uygulanabilir bir kullanıcı testi planı
              </p>
            </Card>
            <Card title="Hazırlık Listesi">
              <div className="space-y-2">
                {MEETING_PREPARE_CHECKLIST.map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(label)}
                      onChange={() => toggle(label)}
                      className="size-4 accent-[#555]"
                    />
                    <span
                      className={
                        checked.has(label) ? "text-[#aaa] line-through" : ""
                      }
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card title="Gerekli Dosyalar">
              <p>
                ▱ Pitch Deck v3.pdf <Badge tone="green">Yüklendi</Badge>
              </p>
              <p className="mt-2">
                △ Ürün demosu <Badge>Eksik</Badge>
              </p>
              <p className="mt-2">
                △ Araştırma verisi <Badge>Eksik</Badge>
              </p>
              <SecondaryButton className="mt-4 w-full border-dashed">
                Dosya Yükle
              </SecondaryButton>
            </Card>
            <Card title="Mentora Not">
              <textarea
                placeholder="Mentora iletmek istediğiniz kısa bir not ekleyebilirsiniz..."
                className="min-h-24 w-full resize-none rounded-md border border-[#e5e7eb] p-3 text-sm"
              />
            </Card>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <PrimaryButton href="/meetings/research">
            Toplantı Detayına Git ›
          </PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}
