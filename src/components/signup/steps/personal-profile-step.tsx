"use client";

import { Plus, User } from "lucide-react";

import { ChipGroup } from "@/components/signup/chip-group";
import { FileDrop } from "@/components/signup/file-drop";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import {
  BIO_MAX_LENGTH,
  CONTACT_PREFERENCE_OPTIONS,
  EXPERTISE_OPTIONS,
} from "@/interfaces/signup";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e4e7ea] bg-white px-3.5 text-sm text-[#22262b] outline-none transition placeholder:text-[#a4aab2] focus:border-[#e86f22]";
const labelClass = "mb-1.5 block text-xs font-medium text-[#3c424a]";

export function PersonalProfileStep({ wizard }: { wizard: SignupWizard }) {
  const { draft, updatePersonal, toggleExpertise, toggleContactPreference } =
    wizard;
  const { personal } = draft;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Kişisel profilini oluştur
        </h1>
        <p className="mt-1.5 text-sm text-[#676e78]">
          Mentorların seni tanısın. Startup ekibini daha iyi anlasın.
        </p>
      </header>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="relative size-20 shrink-0 self-start">
            <div className="grid size-20 place-items-center rounded-full border border-dashed border-[#d6dade] bg-[#f8f9fa] text-[#a4aab2]">
              <User className="size-7" strokeWidth={1.5} />
            </div>
            <span className="absolute bottom-0 right-0 grid size-6 place-items-center rounded-full border-2 border-white bg-[#e86f22] text-white">
              <Plus className="size-3" />
            </span>
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="signup-first-name">
                Ad
              </label>
              <input
                id="signup-first-name"
                className={fieldClass}
                value={personal.firstName}
                onChange={(event) =>
                  updatePersonal("firstName", event.target.value)
                }
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="signup-last-name">
                Soyad
              </label>
              <input
                id="signup-last-name"
                className={fieldClass}
                value={personal.lastName}
                onChange={(event) =>
                  updatePersonal("lastName", event.target.value)
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="signup-role">
                Startup&apos;taki rolün
              </label>
              <input
                id="signup-role"
                className={fieldClass}
                value={personal.role}
                onChange={(event) => updatePersonal("role", event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <div>
          <label className={labelClass} htmlFor="signup-bio">
            Kısa tanıtım
          </label>
          <textarea
            id="signup-bio"
            rows={4}
            maxLength={BIO_MAX_LENGTH}
            className={`${fieldClass} min-h-28 resize-y py-3 leading-relaxed`}
            value={personal.bio}
            onChange={(event) => updatePersonal("bio", event.target.value)}
          />
          <p className="mt-1 text-[11px] text-[#a4aab2]">
            {personal.bio.length}/{BIO_MAX_LENGTH}
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="signup-linkedin">
            LinkedIn
          </label>
          <input
            id="signup-linkedin"
            className={fieldClass}
            placeholder="linkedin.com/in/kullanici"
            value={personal.linkedin}
            onChange={(event) => updatePersonal("linkedin", event.target.value)}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold">CV yükle</h2>
          <p className="mb-3 mt-1 text-xs text-[#676e78]">
            PDF veya DOCX formatındaki CV&apos;nizi kullanarak profilinizi
            hazırlayın.
          </p>
          <FileDrop
            file={personal.cv}
            label="CV dosyası seç"
            onChange={(file) => updatePersonal("cv", file)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold">Uzmanlık alanları</h2>
        <ChipGroup
          label="Uzmanlık alanları"
          options={EXPERTISE_OPTIONS}
          selected={personal.expertise}
          onToggle={toggleExpertise}
        />
      </section>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold">İletişim tercihi</h2>
        <ChipGroup
          label="İletişim tercihi"
          options={CONTACT_PREFERENCE_OPTIONS}
          selected={personal.contactPreferences}
          onToggle={toggleContactPreference}
        />
      </section>
    </div>
  );
}
