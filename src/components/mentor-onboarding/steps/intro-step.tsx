"use client";

import { FileText, Loader2, Upload } from "lucide-react";
import { useRef } from "react";

import { ChipGroup } from "@/components/common/chip-group";
import type { MentorOnboarding } from "@/hooks/use-mentor-onboarding";
import {
  ADDITIONAL_EXPERTISE,
  IntroPhase,
  SUGGESTED_EXPERTISE,
} from "@/interfaces/mentor-onboarding";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e4e7ea] bg-white px-3.5 text-sm text-[#22262b] outline-none transition placeholder:text-[#a4aab2] focus:border-[#e86f22]";
const labelClass = "mb-1.5 block text-xs font-medium text-[#3c424a]";

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb < 0.1 ? mb.toFixed(1) : mb.toFixed(1)} MB`;
}

export function IntroStep({ flow }: { flow: MentorOnboarding }) {
  const {
    phase,
    draft,
    uploadCv,
    enterManually,
    restartUpload,
    updateProfile,
  } = flow;
  const inputRef = useRef<HTMLInputElement>(null);

  if (phase === IntroPhase.Upload) {
    return (
      <div className="mx-auto w-full max-w-[560px] space-y-5">
        <header>
          <h1 className="text-[22px] font-semibold tracking-tight">
            Sizi tanıyalım
          </h1>
        </header>

        <section className="rounded-2xl border border-dashed border-[#d6dade] bg-white px-6 py-10 text-center">
          <Upload className="mx-auto size-6 text-[#e86f22]" strokeWidth={1.8} />
          <h2 className="mt-3 text-sm font-semibold">CV&apos;nizi yükleyin</h2>
          <p className="mt-1 text-xs text-[#676e78]">
            PDF veya DOCX · Maks. 10 MB
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#e86f22] px-5 text-sm font-semibold text-white transition hover:bg-[#ce5e19]"
          >
            CV Yükle
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            aria-label="CV dosyası seç"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadCv({ name: file.name, size: file.size });
            }}
          />
        </section>

        <div className="text-center">
          <button
            type="button"
            onClick={enterManually}
            className="text-xs font-semibold text-[#e86f22] hover:underline"
          >
            Bilgilerimi manuel gireceğim
          </button>
          <p className="mt-2 text-xs text-[#858c96]">
            Kontrol her zaman sizde.
          </p>
        </div>
      </div>
    );
  }

  if (phase === IntroPhase.Parsing) {
    return (
      <div
        className="mx-auto w-full max-w-[560px] space-y-5"
        aria-live="polite"
        aria-busy="true"
      >
        <header>
          <h1 className="text-[22px] font-semibold tracking-tight">
            Bilgilerinizi hazırlıyoruz
          </h1>
          <p className="mt-1.5 text-sm text-[#676e78]">
            CV&apos;nizdeki deneyim ve uzmanlık bilgilerini profilinize
            aktarıyoruz.
          </p>
        </header>

        <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a4aab2]">
            CV
          </p>
          <div className="mt-3 flex items-center gap-3">
            <FileText className="size-5 shrink-0 text-[#676e78]" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {draft.cv?.name ?? "CV"}
              </span>
              {draft.cv ? (
                <span className="block text-[11px] text-[#858c96]">
                  PDF · {formatSize(draft.cv.size)}
                </span>
              ) : null}
            </span>
          </div>
        </section>

        <section className="flex items-center gap-3 rounded-2xl bg-[#fdebdd] p-4">
          <Loader2 className="size-4 shrink-0 animate-spin text-[#c85816]" />
          <span>
            <span className="block text-xs font-medium text-[#c85816]">
              Deneyim, rol ve uzmanlık alanları çıkarılıyor…
            </span>
            <span className="block text-[11px] text-[#c85816]/80">
              Bu işlem genellikle birkaç saniye sürer.
            </span>
          </span>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[620px] space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Bilgilerinizi kontrol edin
        </h1>
      </header>

      <section className="space-y-4 rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Temel bilgiler</h2>
          {draft.cv ? (
            <button
              type="button"
              onClick={restartUpload}
              className="text-xs font-semibold text-[#e86f22] hover:underline"
            >
              Düzenle
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="mentor-name">
              Ad Soyad
            </label>
            <input
              id="mentor-name"
              className={fieldClass}
              value={draft.profile.fullName}
              onChange={(event) =>
                updateProfile("fullName", event.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="mentor-title">
              Mevcut unvan
            </label>
            <input
              id="mentor-title"
              className={fieldClass}
              value={draft.profile.title}
              onChange={(event) => updateProfile("title", event.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="mentor-company">
              Şirket
            </label>
            <input
              id="mentor-company"
              className={fieldClass}
              value={draft.profile.company}
              onChange={(event) => updateProfile("company", event.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="mentor-experience">
              Toplam deneyim
            </label>
            <input
              id="mentor-experience"
              className={fieldClass}
              placeholder="Örn. 9 yıl"
              value={draft.profile.totalExperience}
              onChange={(event) =>
                updateProfile("totalExperience", event.target.value)
              }
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold">
          Deneyiminize göre belirlenen alanlar
        </h2>
        <p className="mb-3 mt-1.5 text-xs text-[#676e78]">
          Profilinize eklenecek alanları seçin.
        </p>
        <ChipGroup
          label="Belirlenen alanlar"
          options={[...SUGGESTED_EXPERTISE, ...ADDITIONAL_EXPERTISE]}
          selected={draft.profile.inferredAreas}
          onToggle={(value) =>
            updateProfile(
              "inferredAreas",
              draft.profile.inferredAreas.includes(value)
                ? draft.profile.inferredAreas.filter((item) => item !== value)
                : [...draft.profile.inferredAreas, value],
            )
          }
        />
      </section>
    </div>
  );
}
