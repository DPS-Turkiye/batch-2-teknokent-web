"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";

type Analysis = {
  id: string;
  sourceFilename: string;
  profileType: "mentee" | "individual_mentee";
  profile: Record<string, unknown> | string;
  status: "DRAFT" | "CONFIRMED";
  consentAcceptedAt?: string | null;
  redactionSummary?: Record<string, number> | string;
  ocrSummary?: Record<string, unknown> | string;
  createdAt: string;
};

type ProfileType = Analysis["profileType"];
type OcrMode = "off" | "auto" | "force";
type EditableProfile = Record<string, string>;
type ProfileFieldDefinition = [string, string, "input" | "textarea"];
type TechnologyInference = {
  tag: string;
  type: "EXPLICIT_RECOVERY" | "DERIVED_CAPABILITY";
  confidence: "HIGH" | "MEDIUM";
  evidence: string;
};

function list(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function profileFields(profileType: ProfileType): ProfileFieldDefinition[] {
  return profileType === "individual_mentee"
    ? [
        ["professional_summary", "Profesyonel özet", "textarea"],
        ["current_role", "Mevcut rol", "input"],
        ["desired_role", "Hedef rol", "input"],
        ["industries", "Sektörler (virgülle ayırın)", "input"],
        ["technologies", "Teknolojiler (virgülle ayırın)", "input"],
        ["skills_to_develop", "Geliştirmek istediğiniz beceriler", "input"],
      ]
    : [
        ["startup_name", "Girişim adı", "input"],
        ["startup_summary", "Girişim özeti", "textarea"],
        ["stage", "Girişim aşaması", "input"],
        ["business_model", "İş modeli", "input"],
        ["sectors", "Sektörler (virgülle ayırın)", "input"],
        ["target_markets", "Hedef pazarlar (virgülle ayırın)", "input"],
        ["technologies", "Teknolojiler (virgülle ayırın)", "input"],
      ];
}

function editableProfile(
  profile: Record<string, unknown>,
  profileType: ProfileType,
): EditableProfile {
  return Object.fromEntries(
    profileFields(profileType).map(([key]) => [
      key,
      Array.isArray(profile[key])
        ? list(profile[key]).join(", ")
        : String(profile[key] ?? ""),
    ]),
  );
}

function profilePayload(
  original: Record<string, unknown>,
  draft: EditableProfile,
  profileType: ProfileType,
) {
  const listKeys = new Set(
    profileType === "individual_mentee"
      ? ["industries", "technologies", "skills_to_develop"]
      : ["sectors", "target_markets", "technologies"],
  );
  const payload = Object.fromEntries(
    Object.entries({ ...original, ...draft }).map(([key, value]) => [
      key,
      listKeys.has(key) && typeof value === "string"
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : value,
    ]),
  );
  const retainedTechnologies = new Set(
    Array.isArray(payload.technologies)
      ? payload.technologies.filter(
          (technology): technology is string => typeof technology === "string",
        )
      : [],
  );
  if (Array.isArray(payload.technology_inferences)) {
    payload.technology_inferences = payload.technology_inferences.filter(
      (inference) =>
        inference &&
        typeof inference === "object" &&
        "tag" in inference &&
        typeof inference.tag === "string" &&
        retainedTechnologies.has(inference.tag),
    );
  }
  return payload;
}

function technologyInferences(
  profile: Record<string, unknown>,
): TechnologyInference[] {
  if (!Array.isArray(profile.technology_inferences)) return [];
  return profile.technology_inferences.filter(
    (item): item is TechnologyInference =>
      Boolean(item) &&
      typeof item === "object" &&
      "tag" in item &&
      typeof item.tag === "string" &&
      "type" in item &&
      (item.type === "EXPLICIT_RECOVERY" ||
        item.type === "DERIVED_CAPABILITY") &&
      "confidence" in item &&
      (item.confidence === "HIGH" || item.confidence === "MEDIUM") &&
      "evidence" in item &&
      typeof item.evidence === "string",
  );
}

export function ProfileAnalysisView() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [profileType, setProfileType] = useState<
    "mentee" | "individual_mentee"
  >("mentee");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [ocrMode, setOcrMode] = useState<OcrMode>("auto");
  const hasSelectedFile = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile-analysis")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && !hasSelectedFile.current) setAnalysis(data);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setError("");
    if (selected) {
      hasSelectedFile.current = true;
      setAnalysis(null);
      setShowManualForm(false);
    }
  }

  async function upload() {
    if (!file || !consentAccepted) return;
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("profileType", profileType);
      form.set("consentAccepted", "true");
      form.set("ocrMode", ocrMode);
      const response = await fetch("/api/profile-analysis", {
        method: "POST",
        body: form,
      });
      const rawBody = await response.text();
      let body: unknown = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        // The backend can return an empty or non-JSON response for infrastructure errors.
      }
      if (!response.ok) {
        const errorBody = body as { message?: string; detail?: string };
        throw new Error(
          errorBody.message ??
            errorBody.detail ??
            `Profil işlenemedi (sunucu yanıtı: ${response.status}).`,
        );
      }
      setAnalysis(body as Analysis);
      if (fileInput.current) fileInput.current.value = "";
      setFile(null);
      setConsentAccepted(false);
      setShowManualForm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profil işlenemedi.");
      setShowManualForm(true);
    } finally {
      setProcessing(false);
    }
  }

  const profile = toProfileObject(analysis?.profile);
  const isIndividual = analysis?.profileType === "individual_mentee";
  const sectors = list(isIndividual ? profile.industries : profile.sectors);
  const technologies = list(profile.technologies);
  const needs = list(profile.skills_to_develop ?? profile.support_needs).map(
    (item) => item,
  );

  return (
    <AppShell title="Girişim Profili" backHref="/dashboard">
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-10 pt-8 sm:px-8">
        <section className="rounded-2xl bg-[#45454d] p-6 text-white sm:p-8">
          <h1 className="text-2xl font-semibold">Profilini oluştur</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
            CV’nizi veya pitch deck’inizi yükleyin. Yapılandırılmış profil
            kaydedilir ve mentor önerileri için kullanılır.
          </p>
        </section>

        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-base font-semibold text-[#364153]">PDF yükle</h2>
          <p className="mt-1 text-sm text-[#6a7282]">
            Yalnızca PDF, en fazla 50 MB.
          </p>
          <fieldset className="mt-4 flex flex-wrap gap-4 text-sm text-[#364153]">
            <label className="flex items-center gap-2">
              <input
                checked={profileType === "individual_mentee"}
                disabled={processing}
                name="profile-type"
                onChange={() => setProfileType("individual_mentee")}
                type="radio"
              />
              Kişisel CV
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={profileType === "mentee"}
                disabled={processing}
                name="profile-type"
                onChange={() => setProfileType("mentee")}
                type="radio"
              />
              Girişim pitch deck’i
            </label>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-[#364153]">
              Yerel OCR seviyesi
            </legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#4b5563]">
              {(
                [
                  ["auto", "Otomatik"],
                  ["force", "OCR’ı zorla"],
                  ["off", "Kapalı"],
                ] as Array<[OcrMode, string]>
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    checked={ocrMode === value}
                    disabled={processing}
                    name="ocr-mode"
                    onChange={() => setOcrMode(value)}
                    type="radio"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#6a7282]">
              Karmaşık sütunlu veya taranmış kişisel CV’lerde “OCR’ı zorla”
              seçeneğini kullanın.
            </p>
          </fieldset>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              accept="application/pdf"
              className="block w-full text-sm text-[#364153]"
              disabled={processing}
              onChange={chooseFile}
              ref={fileInput}
              type="file"
            />
            <PrimaryButton
              disabled={!file || !consentAccepted || processing}
              onClick={upload}
              className="shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Profil çıkarılıyor…" : "Profili Çıkar"}
            </PrimaryButton>
          </div>
          <label className="mt-4 flex items-start gap-2 rounded-lg bg-[#f8fafc] p-3 text-xs leading-5 text-[#4b5563]">
            <input
              checked={consentAccepted}
              className="mt-1"
              onChange={(event) => setConsentAccepted(event.target.checked)}
              type="checkbox"
            />
            <span>
              Belgemdeki bilgilerin profil çıkarma ve mentor eşleştirme amacıyla
              işlenmesini onaylıyorum; e-posta, telefon ve kimlik numaralarının
              harici AI çağrısından önce yerel olarak maskeleneceğini anlıyorum.
            </span>
          </label>
          <p className="mt-3 text-xs text-[#6a7282]">
            Uygulama akışı yalnızca yerel olarak çıkarılmış ve kişisel verileri
            maskelenmiş metni kullanır; orijinal PDF harici AI servisine
            gönderilmez.
          </p>
          <button
            className="mt-3 text-sm font-medium text-[#4f39f6] hover:underline"
            onClick={() => setShowManualForm((visible) => !visible)}
            type="button"
          >
            {showManualForm
              ? "Manuel formu kapat"
              : "Bilgileri PDF olmadan manuel gir"}
          </button>
        </section>

        {error && (
          <p className="rounded-lg border border-[#fecaca] bg-[#fff1f2] p-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        {showManualForm ? (
          <ManualProfileForm
            key={profileType}
            profileType={profileType}
            onSaved={(savedAnalysis) => {
              setAnalysis(savedAnalysis);
              setError("");
              setShowManualForm(false);
            }}
          />
        ) : null}

        {loading ? (
          <p className="text-sm text-[#6a7282]">Kaydedilmiş profil aranıyor…</p>
        ) : analysis ? (
          <>
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-base font-semibold text-[#364153]">
                    Çıkarılan {isIndividual ? "CV profili" : "girişim profili"}
                  </h2>
                  <p className="mt-1 text-sm text-[#6a7282]">
                    {analysis.sourceFilename}
                  </p>
                </div>
                <span className="text-xs text-[#99a1af]">
                  Kaydedildi:{" "}
                  {new Intl.DateTimeFormat("tr-TR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(analysis.createdAt))}
                </span>
              </div>
              {analysis.consentAcceptedAt ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <PrivacySummary value={analysis.redactionSummary} />
                  <OcrSummary value={analysis.ocrSummary} />
                </div>
              ) : null}
              <p className="mt-5 text-sm leading-6 text-[#4b5563]">
                {String(
                  (isIndividual
                    ? profile.professional_summary
                    : profile.startup_summary) ?? "Özet bulunamadı.",
                )}
              </p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <ProfileField
                  label={isIndividual ? "Uzmanlık alanları" : "Sektör"}
                  values={sectors}
                />
                <ProfileField label="Teknolojiler" values={technologies} />
              </div>
              {isIndividual && (
                <p className="mt-5 text-sm text-[#4b5563]">
                  <strong>Mevcut / hedef rol:</strong>{" "}
                  {String(profile.current_role ?? "Belirtilmedi")} /{" "}
                  {String(profile.desired_role ?? "Belirtilmedi")}
                </p>
              )}
              {needs.length > 0 && (
                <p className="mt-5 text-sm text-[#4b5563]">
                  <strong>Destek ihtiyacı:</strong> {needs.join(", ")}
                </p>
              )}
              {analysis.status === "DRAFT" ? (
                <ProfileReview
                  key={analysis.id}
                  analysis={analysis}
                  profile={profile}
                  profileType={analysis.profileType}
                  onClear={() => setAnalysis(null)}
                  onConfirmed={setAnalysis}
                />
              ) : (
                <p className="mt-5 text-sm font-medium text-[#008236]">
                  Profil onaylandı ve eşleşmeye hazır.
                </p>
              )}
            </section>
          </>
        ) : (
          <section className="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-8 text-center text-sm text-[#6a7282]">
            Henüz kaydedilmiş bir girişim profili yok. İlk PDF’yi yükleyerek
            başlayın.
          </section>
        )}

        <p className="text-center text-sm text-[#6a7282]">
          <Link
            className="font-medium text-[#4f39f6] hover:underline"
            href="/dashboard"
          >
            Panele dön
          </Link>
        </p>
      </main>
    </AppShell>
  );
}

function ProfileReview({
  analysis,
  profile,
  profileType,
  onClear,
  onConfirmed,
}: {
  analysis: Analysis;
  profile: Record<string, unknown>;
  profileType: ProfileType;
  onClear: () => void;
  onConfirmed: (analysis: Analysis) => void;
}) {
  const [draft, setDraft] = useState(() =>
    editableProfile(profile, profileType),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inferredTechnologies = technologyInferences(profile);

  async function confirm() {
    setSaving(true);
    setError("");
    const profileToSave = profilePayload(profile, draft, profileType);
    try {
      const response = await fetch(
        `/api/profile-analysis/${analysis.id}/confirmation`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: profileToSave }),
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message ?? body.detail ?? "Profil kaydedilemedi.");
      onConfirmed(body);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Profil kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  function clearFields() {
    setDraft(editableProfile({}, profileType));
    setError("");
    onClear();
  }

  return (
    <div className="mt-6 border-t border-[#e5e7eb] pt-5">
      <h3 className="text-sm font-semibold text-[#364153]">
        Profili gözden geçir
      </h3>
      <p className="mt-1 text-xs text-[#6a7282]">
        Eşleşmeye gönderilmeden önce AI çıktısını düzeltin ve onaylayın.
      </p>
      {inferredTechnologies.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-4">
          <p className="text-sm font-semibold text-[#92400e]">
            Teknoloji kontrol katmanının önerileri
          </p>
          <p className="mt-1 text-xs leading-5 text-[#a16207]">
            Bunlar CV’deki proje ve deneyim kanıtlarından eklendi. Teknolojiler
            alanından kaldırabilir veya onaylayabilirsiniz.
          </p>
          <ul className="mt-3 space-y-3">
            {inferredTechnologies.map((inference) => (
              <li key={inference.tag} className="text-xs text-[#78350f]">
                <strong>{inference.tag}</strong>
                <span className="ml-2 rounded bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-medium">
                  {inference.type === "EXPLICIT_RECOVERY"
                    ? "CV kanıtından bulundu"
                    : "Kanıttan türetildi"}
                  {` · ${inference.confidence === "HIGH" ? "yüksek" : "orta"}`}
                </span>
                <p className="mt-1 leading-5 text-[#92400e]">
                  “{inference.evidence}”
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ProfileEditorFields
        draft={draft}
        fields={profileFields(profileType)}
        onChange={setDraft}
      />
      {error && <p className="mt-3 text-sm text-[#b42318]">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-lg border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          onClick={clearFields}
          type="button"
        >
          Temizle
        </button>
        <PrimaryButton disabled={saving} onClick={confirm}>
          {saving ? "Kaydediliyor…" : "Profili Onayla ve Kaydet"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ManualProfileForm({
  profileType,
  onSaved,
}: {
  profileType: ProfileType;
  onSaved: (analysis: Analysis) => void;
}) {
  const [draft, setDraft] = useState<EditableProfile>(() =>
    editableProfile({}, profileType),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/profile-analysis/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileType,
          profile: profilePayload({}, draft, profileType),
        }),
      });
      const rawBody = await response.text();
      let body: { message?: string; detail?: string } = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        // Keep the fallback message for empty or non-JSON infrastructure errors.
      }
      if (!response.ok) {
        throw new Error(body.message ?? body.detail ?? "Profil kaydedilemedi.");
      }
      onSaved(body as Analysis);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Profil kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#c7d2fe] bg-[#f8faff] p-5">
      <h2 className="text-base font-semibold text-[#364153]">
        Profili manuel oluştur
      </h2>
      <p className="mt-1 text-sm text-[#6a7282]">
        PDF işlenemezse gerekli bilgileri burada tamamlayıp doğrudan
        onaylayabilirsiniz.
      </p>
      <ProfileEditorFields
        draft={draft}
        fields={profileFields(profileType)}
        onChange={setDraft}
      />
      {error ? <p className="mt-3 text-sm text-[#b42318]">{error}</p> : null}
      <PrimaryButton className="mt-4" disabled={saving} onClick={save}>
        {saving ? "Kaydediliyor…" : "Manuel Profili Onayla ve Kaydet"}
      </PrimaryButton>
    </section>
  );
}

function ProfileEditorFields({
  draft,
  fields,
  onChange,
}: {
  draft: EditableProfile;
  fields: ProfileFieldDefinition[];
  onChange: (draft: EditableProfile) => void;
}) {
  return (
    <div className="mt-4 grid gap-3">
      {fields.map(([key, label, kind]) => (
        <label
          key={key}
          className="grid gap-1 text-sm font-medium text-[#4b5563]"
        >
          <span>{label}</span>
          {kind === "textarea" ? (
            <textarea
              className="min-h-24 rounded-md border border-[#d1d5db] bg-white p-2 text-sm font-normal"
              value={draft[key] ?? ""}
              onChange={(event) =>
                onChange({ ...draft, [key]: event.target.value })
              }
            />
          ) : (
            <input
              className="rounded-md border border-[#d1d5db] bg-white p-2 text-sm font-normal"
              value={draft[key] ?? ""}
              onChange={(event) =>
                onChange({ ...draft, [key]: event.target.value })
              }
            />
          )}
        </label>
      ))}
    </div>
  );
}

function PrivacySummary({ value }: { value: Analysis["redactionSummary"] }) {
  let summary: Record<string, number> = {};
  try {
    const parsed =
      typeof value === "string"
        ? (JSON.parse(value) as unknown)
        : (value ?? {});
    summary =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, number>)
        : {};
  } catch {
    summary = {};
  }
  const total = typeof summary.total === "number" ? summary.total : 0;
  return (
    <p className="rounded-lg bg-[#ecfdf3] p-3 text-xs text-[#087443]">
      Yerel gizlilik kontrolü tamamlandı: {total} kişisel veri öğesi harici AI
      çağrısından önce maskelendi.
    </p>
  );
}

function OcrSummary({ value }: { value: Analysis["ocrSummary"] }) {
  let summary: Record<string, unknown> = {};
  try {
    const parsed =
      typeof value === "string" ? (JSON.parse(value) as unknown) : value;
    summary =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
  } catch {
    summary = {};
  }
  const applied = summary.applied === true;
  const mode = String(summary.mode ?? "auto");
  const reason = String(summary.reason ?? "not-needed");
  const language = summary.language ? ` · ${String(summary.language)}` : "";
  const status = applied
    ? "uygulandı"
    : reason === "runtime-unavailable" || reason === "failed"
      ? "uygulanamadı"
      : mode === "off"
        ? "kapalı"
        : "gerekli görülmedi";
  return (
    <p className="rounded-lg bg-[#eff6ff] p-3 text-xs text-[#1d4ed8]">
      Yerel OCR: {status} ({mode}
      {language}).
    </p>
  );
}

function ProfileField({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#99a1af]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[#4b5563]">
        {values.length ? values.join(" · ") : "Belirtilmedi"}
      </p>
    </div>
  );
}

function toProfileObject(
  profile: Analysis["profile"] | undefined,
): Record<string, unknown> {
  if (!profile) return {};
  if (typeof profile !== "string") return profile;
  try {
    const parsed: unknown = JSON.parse(profile);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
