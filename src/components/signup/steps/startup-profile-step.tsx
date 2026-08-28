"use client";

import { ImagePlus } from "lucide-react";

import { ChipGroup } from "@/components/common/chip-group";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import {
  MATURITY_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  PROGRAM_LEVEL_OPTIONS,
  PROGRAM_OPTIONS,
  SECTOR_OPTIONS,
  SUPPORT_AREA_OPTIONS,
  TAGLINE_MAX_LENGTH,
  TEAM_SIZE_OPTIONS,
} from "@/interfaces/signup";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e4e7ea] bg-white px-3.5 text-sm text-[#22262b] outline-none transition placeholder:text-[#a4aab2] focus:border-[#e86f22]";
const labelClass = "mb-1.5 block text-xs font-medium text-[#3c424a]";

function Required() {
  return <span className="text-[#e86f22]">*</span>;
}

export function StartupProfileStep({ wizard }: { wizard: SignupWizard }) {
  const { draft, updateStartup, toggleSupportArea, taglineRemaining } = wizard;
  const { startup } = draft;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Startup profilini oluştur
        </h1>
        <p className="mt-1.5 text-sm text-[#676e78]">
          Koordinatör ve mentorlar bu bilgileri görür.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Temel bilgiler</h2>
            <div className="flex gap-4">
              <div>
                <span className={labelClass}>
                  Logo
                  <Required />
                </span>
                <button
                  type="button"
                  aria-label="Logo yükle"
                  className="grid size-[52px] place-items-center rounded-xl border border-[#e4e7ea] bg-[#f8f9fa] text-[#a4aab2] transition hover:border-[#e86f22] hover:text-[#e86f22]"
                >
                  <ImagePlus className="size-5" strokeWidth={1.6} />
                </button>
              </div>
              <div className="flex-1">
                <label className={labelClass} htmlFor="signup-startup-name">
                  Startup adı
                  <Required />
                </label>
                <input
                  id="signup-startup-name"
                  className={fieldClass}
                  placeholder="Örn. Renk Studio"
                  value={startup.name}
                  onChange={(event) =>
                    updateStartup("name", event.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="signup-tagline">
                Tek satırlık tanım
                <Required />
              </label>
              <input
                id="signup-tagline"
                className={fieldClass}
                maxLength={TAGLINE_MAX_LENGTH}
                placeholder="Ne yapıyorsunuz? Kime? 80 karakterde."
                value={startup.tagline}
                onChange={(event) =>
                  updateStartup("tagline", event.target.value)
                }
              />
              <p className="mt-1 text-[11px] text-[#a4aab2]">
                {startup.tagline.length}/{TAGLINE_MAX_LENGTH}
                {taglineRemaining <= 10 ? " · sınıra yaklaşıyorsun" : ""}
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="signup-website">
                Web sitesi / sosyal link
                <Required />
              </label>
              <input
                id="signup-website"
                className={fieldClass}
                placeholder="https://"
                value={startup.website}
                onChange={(event) =>
                  updateStartup("website", event.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="signup-program">
                Dahil olduğun program
              </label>
              <select
                id="signup-program"
                className={fieldClass}
                value={startup.program}
                onChange={(event) =>
                  updateStartup("program", event.target.value)
                }
              >
                {PROGRAM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Girişim hakkında</h2>
            <div>
              <label className={labelClass} htmlFor="signup-problem">
                Hangi problemi çözüyorsunuz?
              </label>
              <textarea
                id="signup-problem"
                rows={3}
                className={`${fieldClass} min-h-24 resize-y py-3 leading-relaxed`}
                placeholder="Kullanıcının yaşadığı asıl sıkıntı nedir?"
                value={startup.problem}
                onChange={(event) =>
                  updateStartup("problem", event.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="signup-solution">
                Çözümünüz nedir?
              </label>
              <textarea
                id="signup-solution"
                rows={3}
                className={`${fieldClass} min-h-24 resize-y py-3 leading-relaxed`}
                value={startup.solution}
                onChange={(event) =>
                  updateStartup("solution", event.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="signup-current-solution">
                Şu anda bunu nasıl çözüyorsunuz?
              </label>
              <textarea
                id="signup-current-solution"
                rows={3}
                className={`${fieldClass} min-h-24 resize-y py-3 leading-relaxed`}
                value={startup.currentSolution}
                onChange={(event) =>
                  updateStartup("currentSolution", event.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="signup-target-user">
                Hedef kullanıcı / müşteri
              </label>
              <input
                id="signup-target-user"
                className={fieldClass}
                placeholder="Örn. KOBİ muhasebe departmanları"
                value={startup.targetUser}
                onChange={(event) =>
                  updateStartup("targetUser", event.target.value)
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="signup-sector">
                  Sektör
                </label>
                <select
                  id="signup-sector"
                  className={fieldClass}
                  value={startup.sector}
                  onChange={(event) =>
                    updateStartup("sector", event.target.value)
                  }
                >
                  <option value="">Seç…</option>
                  {SECTOR_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="signup-maturity">
                  Olgunluk seviyesi
                </label>
                <select
                  id="signup-maturity"
                  className={fieldClass}
                  value={startup.maturity}
                  onChange={(event) =>
                    updateStartup("maturity", event.target.value)
                  }
                >
                  <option value="">Seç…</option>
                  {MATURITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Bugünkü durum</h2>
            <div>
              <span className={labelClass}>Ekip büyüklüğü</span>
              <div
                role="group"
                aria-label="Ekip büyüklüğü"
                className="flex flex-wrap gap-2"
              >
                {TEAM_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={startup.teamSize === option}
                    onClick={() => updateStartup("teamSize", option)}
                    className={`min-h-9 min-w-11 rounded-lg border px-3 text-xs font-medium transition ${
                      startup.teamSize === option
                        ? "border-[#e86f22] bg-[#fff9f5] text-[#c85816]"
                        : "border-[#e4e7ea] bg-white text-[#676e78] hover:border-[#f2b78f]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="signup-product-status">
                Ürün durumu
              </label>
              <select
                id="signup-product-status"
                className={fieldClass}
                value={startup.productStatus}
                onChange={(event) =>
                  updateStartup("productStatus", event.target.value)
                }
              >
                <option value="">Seç…</option>
                {PRODUCT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="signup-user-evidence">
                Mevcut kullanıcı / müşteri kanıtı
              </label>
              <textarea
                id="signup-user-evidence"
                rows={3}
                className={`${fieldClass} min-h-24 resize-y py-3 leading-relaxed`}
                value={startup.userEvidence}
                onChange={(event) =>
                  updateStartup("userEvidence", event.target.value)
                }
              />
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Destek alanları</h2>
            <p className="mb-3 mt-1.5 text-xs text-[#676e78]">
              Hangi konularda mentor desteğine ihtiyacın var?
            </p>
            <ChipGroup
              label="Destek alanları"
              options={SUPPORT_AREA_OPTIONS}
              selected={startup.supportAreas}
              onToggle={toggleSupportArea}
            />
            {startup.supportAreas.length ? (
              <p className="mt-3 text-[11px] text-[#858c96]">
                Seçilen: {startup.supportAreas.join(", ")}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold">Program seviyesi</h2>
            <div role="radiogroup" aria-label="Program seviyesi">
              {PROGRAM_LEVEL_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-[#3c424a]"
                >
                  <input
                    type="radio"
                    name="program-level"
                    value={option}
                    checked={startup.programLevel === option}
                    onChange={() => updateStartup("programLevel", option)}
                    className="size-4 accent-[#e86f22]"
                  />
                  {option}
                </label>
              ))}
            </div>
          </section>

          <p className="rounded-2xl bg-[#f1f2f4] p-4 text-xs leading-relaxed text-[#676e78]">
            Taslak olarak kaydedebilirsin. Profil göndermeden önce gözden
            geçirmen için bir özet ekranı gösterilecek.
          </p>
        </aside>
      </div>
    </div>
  );
}
