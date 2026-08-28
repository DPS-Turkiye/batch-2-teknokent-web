"use client";

import type { SignupWizard } from "@/hooks/use-signup-wizard";
import { SignupStep, STARTUP_DOCUMENTS } from "@/interfaces/signup";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-[#f1f2f4] py-3 last:border-b-0 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-xs text-[#858c96]">{label}</dt>
      <dd className="text-sm text-[#22262b]">{children}</dd>
    </div>
  );
}

function EditableSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-[#e86f22] hover:text-[#c85816]"
        >
          Düzenle
        </button>
      </div>
      <dl className="mt-2">{children}</dl>
    </section>
  );
}

const EMPTY = "—";

export function ReviewStep({ wizard }: { wizard: SignupWizard }) {
  const { draft, goToStep } = wizard;
  const { personal, startup, documents } = draft;

  const fullName =
    [personal.firstName, personal.lastName].filter(Boolean).join(" ") || EMPTY;
  const uploaded = STARTUP_DOCUMENTS.filter((doc) => documents[doc.kind]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Profilini gözden geçir
        </h1>
        <p className="mt-1.5 text-sm text-[#676e78]">
          Koordinatöre göndermeden önce bilgilerini kontrol et.
        </p>
      </header>

      <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[#f1f2f4] text-sm font-bold text-[#858c96]">
            {startup.name.slice(0, 2).toUpperCase() || "ST"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">
                {startup.name || "Startup adı"}
              </h2>
              <span className="rounded-md bg-[#eaf1fb] px-2 py-0.5 text-[11px] font-semibold text-[#2f6fd0]">
                {startup.programLevel}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#676e78]">
              {startup.problem || startup.tagline || EMPTY}
            </p>
          </div>
        </div>
      </section>

      <EditableSection
        title="Kişisel bilgiler"
        onEdit={() => goToStep(SignupStep.PersonalProfile)}
      >
        <Row label="Ad soyad">{fullName}</Row>
        <Row label="Rol">{personal.role || EMPTY}</Row>
        <Row label="Bio">{personal.bio || EMPTY}</Row>
        <Row label="LinkedIn">
          {personal.linkedin ? (
            <span className="text-[#2f6fd0]">{personal.linkedin}</span>
          ) : (
            EMPTY
          )}
        </Row>
        <Row label="Uzmanlıklar">
          {personal.expertise.length ? (
            <span className="flex flex-wrap gap-1.5">
              {personal.expertise.map((item) => (
                <span
                  key={item}
                  className="rounded-md bg-[#f1f2f4] px-2 py-0.5 text-[11px] text-[#3c424a]"
                >
                  {item}
                </span>
              ))}
            </span>
          ) : (
            EMPTY
          )}
        </Row>
        <Row label="İletişim">
          {personal.contactPreferences.join(", ") || EMPTY}
        </Row>
        <Row label="CV">{personal.cv?.name ?? EMPTY}</Row>
      </EditableSection>

      <EditableSection
        title="Temel bilgiler"
        onEdit={() => goToStep(SignupStep.StartupProfile)}
      >
        <Row label="Startup adı">{startup.name || EMPTY}</Row>
        <Row label="Tanım">{startup.tagline || EMPTY}</Row>
        <Row label="Web sitesi">{startup.website || EMPTY}</Row>
        <Row label="Program">{startup.program}</Row>
        <Row label="Destek alanları">
          {startup.supportAreas.join(", ") || EMPTY}
        </Row>
      </EditableSection>

      <EditableSection
        title="Dosyalar"
        onEdit={() => goToStep(SignupStep.Documents)}
      >
        {uploaded.length ? (
          uploaded.map((doc) => (
            <Row key={doc.kind} label={doc.title.replace(" yükle", "")}>
              {documents[doc.kind]?.name}
            </Row>
          ))
        ) : (
          <Row label="Dosyalar">Henüz dosya yüklenmedi</Row>
        )}
      </EditableSection>
    </div>
  );
}
