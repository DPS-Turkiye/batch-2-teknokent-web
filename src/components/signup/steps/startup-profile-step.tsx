"use client";

import {
  OnboardingCard,
  OnboardingChips,
  OnboardingCounter,
  OnboardingField,
  OnboardingImagePicker,
  OnboardingListRow,
  OnboardingNote,
  OnboardingTextAction,
  onboardingInputClass,
} from "@/components/onboarding/onboarding-ui";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import { useProgramNames } from "@/hooks/use-programs";
import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { useTeamMemberForm } from "@/hooks/use-team-member-form";
import {
  MAX_SUPPORT_AREAS,
  STARTUP_STAGE_DESCRIPTIONS,
  STARTUP_STAGE_OPTIONS,
  SUPPORT_AREA_OPTIONS,
  TAGLINE_MAX_LENGTH,
} from "@/interfaces/signup";
import { initials } from "@/lib/utils";

const TONE = OnboardingTone.Mentee;
const theme = ONBOARDING_TONES[TONE];
const inputClass = `${onboardingInputClass} ${theme.focus}`;
/** "Bağımsız" is the no-program answer, sent as a null program id. */
const INDEPENDENT = "Bağımsız";

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="grid size-8 shrink-0 place-items-center rounded-full bg-[#fff4ec] text-[11px] font-semibold leading-[17px] text-[#9e4400]"
    >
      {initials(name) || "?"}
    </span>
  );
}

export function StartupProfileStep({ wizard }: { wizard: SignupWizard }) {
  const {
    draft,
    updateStartup,
    toggleSupportArea,
    addTeamMember,
    removeTeamMember,
  } = wizard;
  const { startup, personal } = draft;
  const programs = useProgramNames();
  const memberForm = useTeamMemberForm(addTeamMember);

  const programOptions = [
    ...(programs.data ?? []).map((program) => program.name),
    INDEPENDENT,
  ];
  const selectedProgram =
    startup.programId === null
      ? INDEPENDENT
      : (programs.data?.find((program) => program.id === startup.programId)
          ?.name ?? "");

  function chooseProgram(name: string) {
    const match = programs.data?.find((program) => program.name === name);
    updateStartup("programId", match ? match.id : null);
  }

  const founderName = `${personal.firstName} ${personal.lastName}`.trim();

  return (
    <>
      <OnboardingCard title="Temel bilgiler">
        <div className="flex items-center gap-4">
          <OnboardingImagePicker
            label="Startup logosu"
            placeholder="Logo"
            file={startup.logo}
            onChange={(file) => updateStartup("logo", file)}
          />
          <OnboardingField
            id="signup-startup-name"
            label="Startup adı"
            required
            tone={TONE}
          >
            <input
              id="signup-startup-name"
              className={inputClass}
              value={startup.name}
              onChange={(event) => updateStartup("name", event.target.value)}
            />
          </OnboardingField>
        </div>
        <OnboardingField
          id="signup-tagline"
          label="Tek satırlık tanım"
          required
          tone={TONE}
        >
          <input
            id="signup-tagline"
            className={inputClass}
            maxLength={TAGLINE_MAX_LENGTH}
            value={startup.tagline}
            onChange={(event) => updateStartup("tagline", event.target.value)}
          />
        </OnboardingField>
        <OnboardingCounter
          hint="Mentor havuzunda startupının altında bu cümle görünür"
          length={startup.tagline.length}
          max={TAGLINE_MAX_LENGTH}
        />
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <OnboardingField id="signup-website" label="Web sitesi" tone={TONE}>
            <input
              id="signup-website"
              className={inputClass}
              placeholder="ornek.com"
              value={startup.website}
              onChange={(event) => updateStartup("website", event.target.value)}
            />
          </OnboardingField>
          <OnboardingField
            id="signup-founded-year"
            label="Kuruluş yılı"
            tone={TONE}
          >
            <input
              id="signup-founded-year"
              className={inputClass}
              inputMode="numeric"
              maxLength={4}
              placeholder="2026"
              value={startup.foundedYear}
              onChange={(event) =>
                updateStartup(
                  "foundedYear",
                  event.target.value.replace(/\D/g, ""),
                )
              }
            />
          </OnboardingField>
        </div>
      </OnboardingCard>

      <OnboardingCard
        title="Program ve aşama"
        subtitle="Doğru mentorla eşleşmen için en belirleyici iki bilgi."
      >
        <p className="text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
          Program
        </p>
        {programs.isLoading ? (
          <p className="text-xs text-[#676e78]">Programlar yükleniyor…</p>
        ) : (
          <OnboardingChips
            tone={TONE}
            label="Program"
            options={programOptions}
            selected={selectedProgram ? [selectedProgram] : []}
            onToggle={chooseProgram}
          />
        )}
        <p className="text-[12.5px] font-medium leading-[19px] text-[#4a5059]">
          Girişim aşaması
        </p>
        <OnboardingChips
          tone={TONE}
          label="Girişim aşaması"
          options={STARTUP_STAGE_OPTIONS}
          selected={
            startup.maturity
              ? [startup.maturity as (typeof STARTUP_STAGE_OPTIONS)[number]]
              : []
          }
          onToggle={(stage) => updateStartup("maturity", stage)}
        />
        {startup.maturity ? (
          <div className="flex flex-col gap-2 rounded-[10px] bg-[#f5faff] px-4 py-3.5">
            <p className="text-[10.5px] font-semibold uppercase leading-4 text-[#858c96]">
              {startup.maturity}
            </p>
            <p className="text-xs leading-[18px] text-[#4a5059]">
              {STARTUP_STAGE_DESCRIPTIONS[startup.maturity]}
            </p>
          </div>
        ) : null}
      </OnboardingCard>

      <OnboardingCard
        title="Ekip"
        subtitle="Ekip üyeleri startup profilinde listelenir. Davet koduyla katıldıklarında hesaplarına bağlanır."
        action={
          memberForm.open ? null : (
            <OnboardingTextAction tone={TONE} onClick={memberForm.openForm}>
              + Üye ekle
            </OnboardingTextAction>
          )
        }
      >
        <OnboardingListRow actionLabel="">
          <Avatar name={founderName} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
              {founderName || "Sen"}
            </span>
            <span className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
              {[personal.role.trim(), "Kurucu"].filter(Boolean).join(" · ")}
            </span>
          </span>
        </OnboardingListRow>
        {startup.teamMembers.map((member, index) => (
          <OnboardingListRow
            key={`${member.fullName}-${index}`}
            actionLabel="Kaldır"
            actionAriaLabel={`${member.fullName} üyesini kaldır`}
            onAction={() => removeTeamMember(index)}
          >
            <Avatar name={member.fullName} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[13px] font-medium leading-5 text-[#22262b]">
                {member.fullName}
              </span>
              <span className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                {[member.jobTitle, member.email].filter(Boolean).join(" · ") ||
                  "Rol belirtilmedi"}
              </span>
            </span>
          </OnboardingListRow>
        ))}
        {memberForm.open ? (
          <div className="flex flex-col gap-3 rounded-lg border border-[#e4e7ea] p-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <OnboardingField
                id="team-member-name"
                label="Ad soyad"
                required
                tone={TONE}
              >
                <input
                  id="team-member-name"
                  className={inputClass}
                  value={memberForm.member.fullName}
                  onChange={(event) =>
                    memberForm.update("fullName", event.target.value)
                  }
                />
              </OnboardingField>
              <OnboardingField id="team-member-role" label="Rol" tone={TONE}>
                <input
                  id="team-member-role"
                  className={inputClass}
                  value={memberForm.member.jobTitle}
                  onChange={(event) =>
                    memberForm.update("jobTitle", event.target.value)
                  }
                />
              </OnboardingField>
            </div>
            <OnboardingField id="team-member-email" label="E-posta" tone={TONE}>
              <input
                id="team-member-email"
                type="email"
                className={inputClass}
                value={memberForm.member.email}
                onChange={(event) =>
                  memberForm.update("email", event.target.value)
                }
              />
            </OnboardingField>
            {memberForm.error ? (
              <p role="alert" className="text-xs text-[#b42318]">
                {memberForm.error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={memberForm.cancel}
                className="rounded-full px-4 py-2 text-[12.5px] font-medium text-[#4a5059] hover:bg-[#f8f9fa]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={memberForm.submit}
                className={`rounded-full px-4 py-2 text-[12.5px] font-medium text-white ${theme.bg} ${theme.bgHover}`}
              >
                Ekle
              </button>
            </div>
          </div>
        ) : null}
      </OnboardingCard>

      <OnboardingCard
        title="Mentor desteği istediğin alanlar"
        subtitle={`En fazla ${MAX_SUPPORT_AREAS} alan seç. Mentor önerileri buna göre sıralanır.`}
      >
        <OnboardingChips
          tone={TONE}
          label="Mentor desteği istediğin alanlar"
          options={SUPPORT_AREA_OPTIONS}
          selected={
            startup.supportAreas as (typeof SUPPORT_AREA_OPTIONS)[number][]
          }
          onToggle={toggleSupportArea}
        />
        {wizard.supportAreaLimitReached ? (
          <OnboardingNote>
            En fazla {MAX_SUPPORT_AREAS} alan seçebilirsin. Değiştirmek için
            birini kaldır.
          </OnboardingNote>
        ) : null}
      </OnboardingCard>
    </>
  );
}
