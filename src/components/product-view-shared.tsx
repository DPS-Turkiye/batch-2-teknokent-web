"use client";

import { useState, type ReactNode } from "react";

import { Avatar } from "@/components/common/avatar";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { ACCEPTED_CALENDAR_DAYS } from "@/lib/const";

export function AcceptedRequestCalendar() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <div className="rounded-md bg-[#f5f5f5] p-3 text-[#444]">
        <p className="text-xs font-semibold">Mentorun mesajı:</p>
        <p className="mt-1 text-sm leading-5">
          &quot;Merhaba, talebinizi inceledim. Kullanıcı testi konusunda
          yardımcı olmaktan memnuniyet duyarım. Bir sonraki adım olarak toplantı
          planlayalım.&quot;
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ACCEPTED_CALENDAR_DAYS.map(([day, ...slots]) => (
          <div key={day}>
            <h3 className="mb-2 text-center text-xs font-medium text-[#6a7282]">
              {day}
            </h3>
            <div className="space-y-2">
              {slots.map((slot) => {
                const value = `${day} ${slot}`;
                return (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={selected === value}
                    onClick={() => setSelected(value)}
                    className={`h-9 w-full rounded-md border text-xs font-medium ${selected === value ? "border-[#555] bg-[#555] text-white" : "border-[#e5e7eb] bg-white text-[#364153]"}`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <SecondaryButton disabled>Başka Saat Öner</SecondaryButton>
        <PrimaryButton
          href={selected ? "/meetings/research" : undefined}
          disabled={!selected}
        >
          Saat Seç
        </PrimaryButton>
      </div>
    </div>
  );
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#aaa]">{label}</dt>
      <dd className="mt-1 text-sm text-[#444]">{value}</dd>
    </div>
  );
}

export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 text-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.03em] text-[#777]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Person({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <Avatar initials={initials} size="sm" />
      <span>{name}</span>
    </div>
  );
}
