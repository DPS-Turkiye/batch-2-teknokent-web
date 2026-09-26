"use client";

import { ArrowDown, ArrowUp, Minus, Plus, X } from "lucide-react";
import type { ReactNode } from "react";

import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import {
  useProgramArchive,
  useProgramCoordinators,
  useProgramSettings,
} from "@/hooks/use-coordinator-program";
import {
  type CoordinatorProgramDetail,
  ProgramLifecycle,
} from "@/interfaces/coordinator-program";
import {
  MAX_PHASES,
  ProgramTab,
  RULE_LIMITS,
  SETTINGS_SECTION_LABELS,
  SettingsSection,
  stepDays,
} from "@/lib/coordinator-program-detail";

const FIELD =
  "mt-1.5 h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b] disabled:bg-[#f7f8f9]";
const SMALL_FIELD =
  "h-10 rounded-xl border border-[#e9ecef] px-3 text-[13px] outline-none disabled:bg-[#f7f8f9]";

export function ProgramSettingsView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Settings}>
      {(detail) => (
        <SettingsBody
          key={detail.program.id}
          programId={programId}
          detail={detail}
        />
      )}
    </ProgramDetailFrame>
  );
}

function SettingsBody({
  programId,
  detail,
}: {
  programId: string;
  detail: CoordinatorProgramDetail;
}) {
  const settings = useProgramSettings(programId, detail);
  const archived = detail.program.lifecycle === ProgramLifecycle.Completed;
  const draft = settings.draft;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav
        aria-label="Ayar bölümleri"
        className="lg:sticky lg:top-6 lg:self-start"
      >
        <ul className="space-y-1">
          {Object.values(SettingsSection).map((section) => (
            <li key={section}>
              <a
                href={`#${section.toLowerCase()}`}
                onClick={() => settings.setSection(section)}
                aria-current={settings.section === section ? "true" : undefined}
                className={`block rounded-2xl px-4 py-2.5 text-[13.5px] ${
                  settings.section === section
                    ? "bg-[#f4f5f7] text-[#22262b]"
                    : "text-[#676e78]"
                }`}
              >
                {SETTINGS_SECTION_LABELS[section]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-5">
        {archived ? (
          <p className="rounded-2xl bg-[#f4f5f7] px-5 py-3 text-[13px] text-[#676e78]">
            Bu program arşivlendi ve salt okunur. Değiştirmek için aşağıdan
            yeniden açın.
          </p>
        ) : null}

        <Section id={SettingsSection.General} title="Genel bilgiler">
          <Row>
            <label className="block text-[12.5px] font-medium text-[#676e78]">
              Program adı
              <input
                value={draft.name}
                maxLength={255}
                disabled={archived}
                onChange={(event) =>
                  settings.update({ name: event.target.value })
                }
                className={FIELD}
              />
            </label>
          </Row>
          <Row>
            <label className="block text-[12.5px] font-medium text-[#676e78]">
              Açıklama
              <textarea
                value={draft.description ?? ""}
                maxLength={2000}
                rows={3}
                disabled={archived}
                onChange={(event) =>
                  settings.update({ description: event.target.value })
                }
                className={`${FIELD} h-auto py-3`}
              />
            </label>
          </Row>
          <Row>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[12.5px] font-medium text-[#676e78]">
                Başlangıç
                <input
                  type="date"
                  value={draft.startDate ?? ""}
                  disabled={archived}
                  onChange={(event) =>
                    settings.update({ startDate: event.target.value || null })
                  }
                  className={FIELD}
                />
              </label>
              <label className="block text-[12.5px] font-medium text-[#676e78]">
                Bitiş
                <input
                  type="date"
                  value={draft.endDate ?? ""}
                  disabled={archived}
                  onChange={(event) =>
                    settings.update({ endDate: event.target.value || null })
                  }
                  className={FIELD}
                />
              </label>
            </div>
          </Row>
          <Row>
            <p className="text-[13.5px] font-medium text-[#22262b]">
              Program fazları
            </p>
            <p className="text-[12.5px] text-[#858c96]">
              Genel Bakış ve Programlarım’daki faz çubuğu bu sırayı izler.
            </p>
            <ol className="mt-3 space-y-2">
              {draft.phases.map((phase, index) => (
                <li
                  key={phase.key}
                  className="grid gap-2 rounded-2xl border border-[#f0f2f4] p-3 sm:grid-cols-[1fr_150px_150px_auto]"
                >
                  <input
                    aria-label={`${index + 1}. faz adı`}
                    value={phase.name}
                    maxLength={120}
                    disabled={archived}
                    placeholder="Faz adı"
                    onChange={(event) =>
                      settings.updatePhase(phase.key, {
                        name: event.target.value,
                      })
                    }
                    className={SMALL_FIELD}
                  />
                  <input
                    type="date"
                    aria-label={`${index + 1}. faz başlangıcı`}
                    value={phase.startDate ?? ""}
                    disabled={archived}
                    onChange={(event) =>
                      settings.updatePhase(phase.key, {
                        startDate: event.target.value || null,
                      })
                    }
                    className={SMALL_FIELD}
                  />
                  <input
                    type="date"
                    aria-label={`${index + 1}. faz bitişi`}
                    value={phase.endDate ?? ""}
                    disabled={archived}
                    onChange={(event) =>
                      settings.updatePhase(phase.key, {
                        endDate: event.target.value || null,
                      })
                    }
                    className={SMALL_FIELD}
                  />
                  <span className="flex items-center gap-1">
                    <IconButton
                      label={`${index + 1}. fazı yukarı taşı`}
                      disabled={archived || index === 0}
                      onClick={() => settings.movePhase(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton
                      label={`${index + 1}. fazı aşağı taşı`}
                      disabled={archived || index === draft.phases.length - 1}
                      onClick={() => settings.movePhase(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <IconButton
                      label={`${index + 1}. fazı sil`}
                      disabled={archived}
                      onClick={() => settings.removePhase(phase.key)}
                    >
                      <X className="size-4" />
                    </IconButton>
                  </span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              disabled={archived || draft.phases.length >= MAX_PHASES}
              onClick={settings.addPhase}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] text-[#22262b] disabled:text-[#aeb4bc]"
            >
              <Plus aria-hidden className="size-4" /> Faz ekle
            </button>
          </Row>
        </Section>

        <CoordinatorsSection
          programId={programId}
          detail={detail}
          archived={archived}
        />

        <Section
          id={SettingsSection.Rules}
          title="Mentorluk kuralları"
          note="Bu eşikler Anasayfa’daki “Mentorluk sağlığı” ve “Öncelikli aksiyonlar” hesaplarını belirler."
        >
          <Row>
            <DayStepper
              title="Hedef görüşme sıklığı"
              hint="Takımların mentorlarıyla görüşmesi beklenen aralık"
              value={draft.meetingFrequencyDays}
              disabled={archived}
              onChange={(delta) =>
                settings.update({
                  meetingFrequencyDays: stepDays(
                    draft.meetingFrequencyDays,
                    delta,
                    RULE_LIMITS.meetingFrequencyDays,
                  ),
                })
              }
            />
          </Row>
          <Row>
            <DayStepper
              title="“Uzun süredir görüşme yok” eşiği"
              hint="Bu süreyi aşan mentorluklar riskli olarak işaretlenir"
              value={draft.staleAfterDays}
              disabled={archived}
              onChange={(delta) =>
                settings.update({
                  staleAfterDays: stepDays(
                    draft.staleAfterDays,
                    delta,
                    RULE_LIMITS.staleAfterDays,
                  ),
                })
              }
            />
          </Row>
          <Row>
            <Toggle
              title="Görüşme notu zorunlu"
              hint="Görüşme sonrası not girilmezse aksiyon oluşur"
              checked={draft.meetingNoteRequired}
              disabled={archived}
              onChange={(value) =>
                settings.update({ meetingNoteRequired: value })
              }
            />
          </Row>
          <Row>
            <Toggle
              title="Otomatik eşleşme önerileri"
              hint="Uzmanlık, müsaitlik ve yüke göre öneri listesi oluşturulur"
              checked={draft.autoMatchSuggestions}
              disabled={archived}
              onChange={(value) =>
                settings.update({ autoMatchSuggestions: value })
              }
            />
          </Row>
        </Section>

        <ArchiveSection programId={programId} archived={archived} />

        {settings.error ? (
          <p role="alert" className="text-[13px] text-[#d9464b]">
            {settings.error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={settings.cancel}
            disabled={!settings.dirty || settings.saving}
            className="rounded-full border border-[#e9ecef] px-5 py-[11px] text-[13.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={settings.save}
            disabled={archived || !settings.dirty || settings.saving}
            className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {settings.saving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CoordinatorsSection({
  programId,
  detail,
  archived,
}: {
  programId: string;
  detail: CoordinatorProgramDetail;
  archived: boolean;
}) {
  const team = useProgramCoordinators(programId, detail.coordinators);
  return (
    <Section
      id={SettingsSection.Coordinators}
      title="Koordinatörler"
      note="Programı birlikte yöneten koordinatörler. Programı oluşturan kişi çıkarılamaz."
    >
      <ul aria-label="Programın koordinatörleri">
        {team.coordinators.map((coordinator) => (
          <li key={coordinator.id}>
            <Row>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] text-[#22262b]">
                  {coordinator.fullName}
                  {coordinator.owner ? (
                    <span className="ml-2 rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[11.5px] text-[#676e78]">
                      Programı oluşturan
                    </span>
                  ) : null}
                </span>
                {!coordinator.owner ? (
                  <button
                    type="button"
                    disabled={archived || team.busy}
                    onClick={() => team.remove(coordinator.id)}
                    aria-label={`${coordinator.fullName} programdan çıkar`}
                    className="rounded-full border border-[#e9ecef] px-3 py-1.5 text-[12.5px] text-[#d9464b] disabled:text-[#aeb4bc]"
                  >
                    Çıkar
                  </button>
                ) : null}
              </div>
            </Row>
          </li>
        ))}
      </ul>
      <Row>
        {team.picking ? (
          <div className="space-y-2">
            {team.candidatesLoading ? (
              <p className="text-[13px] text-[#858c96]">Yükleniyor…</p>
            ) : team.candidates.length === 0 ? (
              <p className="text-[13px] text-[#858c96]">
                Eklenebilecek başka onaylı koordinatör yok. Yönetici,
                Kullanıcılar’dan yeni koordinatör ekleyebilir.
              </p>
            ) : (
              <ul
                aria-label="Eklenebilecek koordinatörler"
                className="flex flex-wrap gap-2"
              >
                {team.candidates.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      disabled={team.busy}
                      onClick={() => team.add(candidate.id)}
                      className="rounded-full border border-[#e9ecef] px-3 py-1.5 text-[13px] text-[#22262b]"
                    >
                      + {candidate.fullName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={team.closePicker}
              className="text-[12.5px] text-[#676e78]"
            >
              Vazgeç
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={archived}
            onClick={team.openPicker}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] text-[#22262b] disabled:text-[#aeb4bc]"
          >
            <Plus aria-hidden className="size-4" /> Koordinatör ekle
          </button>
        )}
      </Row>
    </Section>
  );
}

function ArchiveSection({
  programId,
  archived,
}: {
  programId: string;
  archived: boolean;
}) {
  const archive = useProgramArchive(programId, archived);
  return (
    <section
      id={SettingsSection.Archive.toLowerCase()}
      aria-labelledby="archive-title"
      className="rounded-[28px] border border-[#f5c9ca] bg-white"
    >
      <h2
        id="archive-title"
        className="border-b border-[#f7e3e3] px-6 py-5 text-[16px] font-semibold text-[#22262b]"
      >
        Tehlikeli bölge
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <span>
          <span className="block text-[13.5px] text-[#22262b]">
            {archived ? "Programı yeniden aç" : "Programı arşivle"}
          </span>
          <span className="block text-[12.5px] text-[#858c96]">
            {archived
              ? "Program yeniden düzenlenebilir olur."
              : "Program salt okunur olur. Mentorluklar takım ve mentorla sürer."}
          </span>
        </span>
        {archived ? (
          <button
            type="button"
            disabled={archive.busy}
            onClick={archive.restore}
            className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white"
          >
            Yeniden aç
          </button>
        ) : archive.confirming ? (
          <span className="flex items-center gap-2">
            <span className="text-[12.5px] text-[#d9464b]">Emin misiniz?</span>
            <button
              type="button"
              onClick={archive.cancel}
              className="rounded-full border border-[#e9ecef] px-3 py-1.5 text-[12.5px]"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={archive.busy}
              onClick={archive.archive}
              className="rounded-full bg-[#d9464b] px-3 py-1.5 text-[12.5px] font-medium text-white"
            >
              Evet, arşivle
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={archive.ask}
            className="rounded-full bg-[#fdeeee] px-4 py-2 text-[13px] font-medium text-[#d9464b]"
          >
            Programı arşivle
          </button>
        )}
      </div>
    </section>
  );
}

function Section({
  id,
  title,
  note,
  children,
}: {
  id: SettingsSection;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id.toLowerCase()}
      aria-labelledby={`${id}-title`}
      className="rounded-[28px] border border-[#e9ecef] bg-white"
    >
      <div className="border-b border-[#f0f2f4] px-6 py-5">
        <h2
          id={`${id}-title`}
          className="text-[16px] font-semibold text-[#22262b]"
        >
          {title}
        </h2>
        {note ? (
          <p className="mt-1 text-[12.5px] text-[#858c96]">{note}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-[#f0f2f4] px-6 py-4 last:border-0">
      {children}
    </div>
  );
}

function DayStepper({
  title,
  hint,
  value,
  disabled,
  onChange,
}: {
  title: string;
  hint: string;
  value: number;
  disabled: boolean;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-[13.5px] text-[#22262b]">{title}</span>
        <span className="block text-[12.5px] text-[#858c96]">{hint}</span>
      </span>
      <span className="flex items-center gap-2 rounded-full border border-[#e9ecef] px-3 py-1.5">
        <span className="min-w-[2ch] text-[14px] font-semibold text-[#22262b]">
          {value}
        </span>
        <span className="text-[12.5px] text-[#858c96]">gün</span>
        <IconButton
          label={`${title}: azalt`}
          disabled={disabled}
          onClick={() => onChange(-1)}
        >
          <Minus className="size-3.5" />
        </IconButton>
        <IconButton
          label={`${title}: artır`}
          disabled={disabled}
          onClick={() => onChange(1)}
        >
          <Plus className="size-3.5" />
        </IconButton>
      </span>
    </div>
  );
}

function Toggle({
  title,
  hint,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-[13.5px] text-[#22262b]">{title}</span>
        <span className="block text-[12.5px] text-[#858c96]">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-[#e0e3e7] transition peer-checked:bg-[#22262b] peer-disabled:opacity-50 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
      />
    </label>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-full bg-[#f4f5f7] text-[#676e78] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
