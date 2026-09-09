"use client";

import { ChipGroup } from "@/components/common/chip-group";
import { FileDrop } from "@/components/common/file-drop";
import { ProgramSelect } from "@/components/common/program-select";
import { useProgramNames } from "@/hooks/use-programs";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import {
  MATURITY_OPTIONS,
  PROGRAM_LEVEL_OPTIONS,
  SECTOR_OPTIONS,
  SUPPORT_AREA_OPTIONS,
  TAGLINE_MAX_LENGTH,
} from "@/interfaces/signup";
import { fieldClass, labelClass } from "@/components/common/form-field";

function Required() {
  return <span className="text-[#e86f22]">*</span>;
}

const NO_PROGRAM_LABEL = "Bir programa dahil değilim";

export function StartupProfileStep({ wizard }: { wizard: SignupWizard }) {
  const programsQuery = useProgramNames();
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
            <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
              <div>
                <span className={labelClass}>
                  Logo
                  <Required />
                </span>
                <FileDrop
                  file={startup.logo}
                  label="Startup logosu seç"
                  accept=".png,.jpg,.jpeg,.webp"
                  helpText="PNG, JPG veya WebP · En fazla 5 MB"
                  maxBytes={5 * 1024 * 1024}
                  onChange={(file) => updateStartup("logo", file)}
                />
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
              <span className={labelClass}>Dahil olduğun program</span>
              {programsQuery.isLoading ? (
                <p className="text-sm text-[#6a7282]">Programlar yükleniyor…</p>
              ) : programsQuery.error ? (
                // A failed load must not silently look like "no programs exist".
                <p className="text-sm text-[#b91c1c]">
                  {programsQuery.error.message}
                </p>
              ) : (
                <ProgramSelect
                  id="signup-program"
                  label="Dahil olduğun program"
                  options={programsQuery.data ?? []}
                  value={startup.programId}
                  onChange={(programId) =>
                    updateStartup("programId", programId)
                  }
                  noProgramLabel={NO_PROGRAM_LABEL}
                />
              )}
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
