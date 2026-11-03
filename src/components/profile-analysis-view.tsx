"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChangeEvent, useRef, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { PersonalProfileSection } from "@/components/profile/personal-profile-section";
import { StartupProfileSection } from "@/components/profile/startup-profile-section";
import { TeamSummarySection } from "@/components/profile/team-summary-section";
import { PrimaryButton } from "@/components/common/primary-button";
import { useOrganizationInvite } from "@/hooks/use-organization-invite";
import {
  useOrganizationMembers,
  useViewerIsFounder,
} from "@/hooks/use-organization-members";
import {
  useConfirmProfile,
  useCreateManualProfile,
  useProfileAnalysis,
  useUploadProfileAnalysis,
} from "@/hooks/use-profile-analysis";
import type {
  OcrMode,
  ProfileAnalysis as Analysis,
  ProfileType,
} from "@/interfaces/profile-analysis";
import { AppArea } from "@/types/app-area";

type ProfileTarget = { kind: "self" } | { kind: "existing"; appUserId: string };

type EditableProfile = Record<string, string>;
type ProfileFieldKey =
  | "professional_summary"
  | "current_role"
  | "desired_role"
  | "industries"
  | "technologies"
  | "skills_to_develop"
  | "startup_name"
  | "startup_summary"
  | "stage"
  | "business_model"
  | "sectors"
  | "target_markets";
type ProfileFieldDefinition = [ProfileFieldKey, "input" | "textarea"];
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
        ["professional_summary", "textarea"],
        ["current_role", "input"],
        ["desired_role", "input"],
        ["industries", "input"],
        ["technologies", "input"],
        ["skills_to_develop", "input"],
      ]
    : [
        ["startup_name", "input"],
        ["startup_summary", "textarea"],
        ["stage", "input"],
        ["business_model", "input"],
        ["sectors", "input"],
        ["target_markets", "input"],
        ["technologies", "input"],
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
  const t = useTranslations("profileAnalysis");
  const locale = useLocale();
  const [target, setTarget] = useState<ProfileTarget>({ kind: "self" });
  const membersQuery = useOrganizationMembers();
  const viewerIsFounder = useViewerIsFounder();
  const inviteQuery = useOrganizationInvite({ enabled: viewerIsFounder });
  const [copied, setCopied] = useState(false);
  const resolvedAppUserId =
    target.kind === "existing" ? target.appUserId : undefined;
  const profileQuery = useProfileAnalysis(resolvedAppUserId);
  const uploadMutation = useUploadProfileAnalysis();
  const [hiddenAnalysisId, setHiddenAnalysisId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [profileType, setProfileType] = useState<
    "mentee" | "individual_mentee"
  >("mentee");
  const [error, setError] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [ocrMode, setOcrMode] = useState<OcrMode>("auto");
  const fileInput = useRef<HTMLInputElement>(null);
  const analysis =
    profileQuery.data?.id === hiddenAnalysisId
      ? null
      : (profileQuery.data ?? null);
  const processing = uploadMutation.isPending;

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setError("");
    if (selected) {
      setHiddenAnalysisId(analysis?.id ?? null);
      setShowManualForm(false);
    }
  }

  async function upload() {
    if (!file || !consentAccepted) return;
    setError("");
    try {
      await uploadMutation.mutateAsync({
        file,
        profileType,
        ocrMode,
        appUserId: resolvedAppUserId,
      });
      setHiddenAnalysisId(null);
      if (fileInput.current) fileInput.current.value = "";
      setFile(null);
      setConsentAccepted(false);
      setShowManualForm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("processFailed"));
      setShowManualForm(true);
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
    <AppShell active={AppArea.Startup} title={t("title")} backHref="/dashboard">
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-10 pt-8 sm:px-8">
        <section className="rounded-2xl bg-[#45454d] p-6 text-white sm:p-8">
          <h1 className="text-2xl font-semibold">{t("heading")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
            {t("intro")}
          </p>
        </section>

        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-base font-semibold text-[#364153]">
            {t("forWhom")}
          </h2>
          <fieldset className="mt-4 flex flex-col gap-3 text-sm text-[#364153]">
            <label className="flex items-center gap-2">
              <input
                checked={target.kind === "self"}
                disabled={processing}
                name="profile-target"
                onChange={() => setTarget({ kind: "self" })}
                type="radio"
              />
              {t("self")}
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={target.kind === "existing"}
                disabled={processing}
                name="profile-target"
                onChange={() => {
                  const firstMember = membersQuery.data?.[0];
                  setTarget(
                    firstMember
                      ? { kind: "existing", appUserId: firstMember.id }
                      : { kind: "existing", appUserId: "" },
                  );
                }}
                type="radio"
              />
              {t("existingMember")}
            </label>
            {target.kind === "existing" ? (
              membersQuery.data && membersQuery.data.length > 0 ? (
                <select
                  className="ml-6 max-w-xs rounded-md border border-[#d1d5db] bg-white p-2 text-sm"
                  disabled={processing}
                  value={target.appUserId}
                  onChange={(event) =>
                    setTarget({
                      kind: "existing",
                      appUserId: event.target.value,
                    })
                  }
                >
                  {membersQuery.data.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="ml-6 text-xs text-[#6a7282]">
                  {t("noMembers")}{" "}
                  <Link
                    className="font-medium text-[#4f39f6] hover:underline"
                    href="/startup/team"
                  >
                    {t("shareInvite")}
                  </Link>
                  .
                </p>
              )
            ) : null}
            {viewerIsFounder ? (
              <div className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] p-3">
                <p className="text-xs font-medium text-[#364153]">
                  {t("inviteTitle")}
                </p>
                <p className="mt-1 text-[11px] text-[#6a7282]">
                  {t("inviteHint")}
                </p>
                {inviteQuery.isLoading ? (
                  <p className="mt-2 text-xs text-[#6a7282]">{t("loading")}</p>
                ) : inviteQuery.error ? (
                  <p className="mt-2 text-xs text-red-600">
                    {inviteQuery.error.message}
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="font-mono text-lg tracking-widest">
                      {inviteQuery.data?.inviteCode}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const code = inviteQuery.data?.inviteCode;
                        if (!code) return;
                        void navigator.clipboard.writeText(code).then(() => {
                          setCopied(true);
                        });
                      }}
                      className="rounded-md border border-[#d1d5db] bg-white px-2 py-1 text-xs font-medium text-[#364153]"
                    >
                      {copied ? t("copied") : t("copy")}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </fieldset>
        </section>

        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-base font-semibold text-[#364153]">
            {t("uploadPdf")}
          </h2>
          <p className="mt-1 text-sm text-[#6a7282]">{t("pdfOnly")}</p>
          <fieldset className="mt-4 flex flex-wrap gap-4 text-sm text-[#364153]">
            <label className="flex items-center gap-2">
              <input
                checked={profileType === "individual_mentee"}
                disabled={processing}
                name="profile-type"
                onChange={() => setProfileType("individual_mentee")}
                type="radio"
              />
              {t("personalCv")}
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={profileType === "mentee"}
                disabled={processing}
                name="profile-type"
                onChange={() => setProfileType("mentee")}
                type="radio"
              />
              {t("pitchDeck")}
            </label>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-[#364153]">
              {t("ocrLevel")}
            </legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#4b5563]">
              {(["auto", "force", "off"] as OcrMode[]).map((value) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    checked={ocrMode === value}
                    disabled={processing}
                    name="ocr-mode"
                    onChange={() => setOcrMode(value)}
                    type="radio"
                  />
                  {t(`ocr.${value}`)}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#6a7282]">{t("ocrHint")}</p>
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
              {processing ? t("extracting") : t("extract")}
            </PrimaryButton>
          </div>
          <label className="mt-4 flex items-start gap-2 rounded-lg bg-[#f8fafc] p-3 text-xs leading-5 text-[#4b5563]">
            <input
              checked={consentAccepted}
              className="mt-1"
              onChange={(event) => setConsentAccepted(event.target.checked)}
              type="checkbox"
            />
            <span>{t("consent")}</span>
          </label>
          <p className="mt-3 text-xs text-[#6a7282]">{t("localOnly")}</p>
          <button
            className="mt-3 text-sm font-medium text-[#4f39f6] hover:underline"
            onClick={() => setShowManualForm((visible) => !visible)}
            type="button"
          >
            {showManualForm ? t("closeManual") : t("openManual")}
          </button>
        </section>

        {error && (
          <p className="rounded-lg border border-[#fecaca] bg-[#fff1f2] p-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}
        {profileQuery.error ? (
          <p className="rounded-lg border border-[#fecaca] bg-[#fff1f2] p-4 text-sm text-[#b42318]">
            {t("savedLoadFailed", { error: profileQuery.error.message })}
          </p>
        ) : null}

        {showManualForm ? (
          <ManualProfileForm
            key={profileType}
            profileType={profileType}
            appUserId={resolvedAppUserId}
            onSaved={() => {
              setHiddenAnalysisId(null);
              setError("");
              setShowManualForm(false);
            }}
          />
        ) : null}

        {profileQuery.isLoading ? (
          <p className="text-sm text-[#6a7282]">{t("searching")}</p>
        ) : analysis ? (
          <>
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-base font-semibold text-[#364153]">
                    {isIndividual ? t("extractedCv") : t("extractedStartup")}
                  </h2>
                  <p className="mt-1 text-sm text-[#6a7282]">
                    {analysis.sourceFilename}
                  </p>
                </div>
                <span className="text-xs text-[#99a1af]">
                  {t("savedAt", {
                    date: new Intl.DateTimeFormat(locale, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(analysis.createdAt)),
                  })}
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
                    : profile.startup_summary) ?? t("noSummary"),
                )}
              </p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <ProfileField
                  label={isIndividual ? t("expertise") : t("sector")}
                  values={sectors}
                />
                <ProfileField label={t("technologies")} values={technologies} />
              </div>
              {isIndividual && (
                <p className="mt-5 text-sm text-[#4b5563]">
                  <strong>{t("roles")}</strong>{" "}
                  {String(profile.current_role ?? t("notSpecified"))} /{" "}
                  {String(profile.desired_role ?? t("notSpecified"))}
                </p>
              )}
              {needs.length > 0 && (
                <p className="mt-5 text-sm text-[#4b5563]">
                  <strong>{t("supportNeeds")}</strong> {needs.join(", ")}
                </p>
              )}
              {analysis.status === "DRAFT" ? (
                <ProfileReview
                  key={analysis.id}
                  analysis={analysis}
                  profile={profile}
                  profileType={analysis.profileType}
                  onClear={() => setHiddenAnalysisId(analysis.id)}
                  onConfirmed={() => setHiddenAnalysisId(null)}
                />
              ) : (
                <p className="mt-5 text-sm font-medium text-[#008236]">
                  {t("confirmed")}
                </p>
              )}
            </section>
          </>
        ) : (
          <section className="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-8 text-center text-sm text-[#6a7282]">
            {t("noProfile")}
          </section>
        )}

        <PersonalProfileSection />

        <StartupProfileSection />

        <TeamSummarySection />

        <p className="text-center text-sm text-[#6a7282]">
          <Link
            className="font-medium text-[#4f39f6] hover:underline"
            href="/dashboard"
          >
            {t("backToPanel")}
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
  const t = useTranslations("profileAnalysis");
  const [draft, setDraft] = useState(() =>
    editableProfile(profile, profileType),
  );
  const confirmMutation = useConfirmProfile();
  const [error, setError] = useState("");
  const inferredTechnologies = technologyInferences(profile);

  async function confirm() {
    setError("");
    const profileToSave = profilePayload(profile, draft, profileType);
    try {
      const confirmed = await confirmMutation.mutateAsync({
        id: analysis.id,
        profile: profileToSave,
      });
      onConfirmed(confirmed);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    }
  }

  function clearFields() {
    setDraft(editableProfile({}, profileType));
    setError("");
    onClear();
  }

  return (
    <div className="mt-6 border-t border-[#e5e7eb] pt-5">
      <h3 className="text-sm font-semibold text-[#364153]">{t("review")}</h3>
      <p className="mt-1 text-xs text-[#6a7282]">{t("reviewHint")}</p>
      {inferredTechnologies.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-4">
          <p className="text-sm font-semibold text-[#92400e]">
            {t("suggestions")}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#a16207]">
            {t("suggestionsHint")}
          </p>
          <ul className="mt-3 space-y-3">
            {inferredTechnologies.map((inference) => (
              <li key={inference.tag} className="text-xs text-[#78350f]">
                <strong>{inference.tag}</strong>
                <span className="ml-2 rounded bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-medium">
                  {inference.type === "EXPLICIT_RECOVERY"
                    ? t("fromCv")
                    : t("derived")}
                  {` · ${inference.confidence === "HIGH" ? t("high") : t("medium")}`}
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
          disabled={confirmMutation.isPending}
          onClick={clearFields}
          type="button"
        >
          {t("clear")}
        </button>
        <PrimaryButton disabled={confirmMutation.isPending} onClick={confirm}>
          {confirmMutation.isPending ? t("saving") : t("confirm")}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ManualProfileForm({
  profileType,
  appUserId,
  onSaved,
}: {
  profileType: ProfileType;
  appUserId?: string;
  onSaved: (analysis: Analysis) => void;
}) {
  const [draft, setDraft] = useState<EditableProfile>(() =>
    editableProfile({}, profileType),
  );
  const t = useTranslations("profileAnalysis");
  const createMutation = useCreateManualProfile();
  const [error, setError] = useState("");

  async function save() {
    setError("");
    try {
      const saved = await createMutation.mutateAsync({
        profileType,
        profile: profilePayload({}, draft, profileType),
        appUserId,
      });
      onSaved(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("saveFailed"));
    }
  }

  return (
    <section className="rounded-xl border border-[#c7d2fe] bg-[#f8faff] p-5">
      <h2 className="text-base font-semibold text-[#364153]">
        {t("manualTitle")}
      </h2>
      <p className="mt-1 text-sm text-[#6a7282]">{t("manualHint")}</p>
      <ProfileEditorFields
        draft={draft}
        fields={profileFields(profileType)}
        onChange={setDraft}
      />
      {error ? <p className="mt-3 text-sm text-[#b42318]">{error}</p> : null}
      <PrimaryButton
        className="mt-4"
        disabled={createMutation.isPending}
        onClick={save}
      >
        {createMutation.isPending ? t("saving") : t("confirmManual")}
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
  const t = useTranslations("profileAnalysis.fields");
  return (
    <div className="mt-4 grid gap-3">
      {fields.map(([key, kind]) => (
        <label
          key={key}
          className="grid gap-1 text-sm font-medium text-[#4b5563]"
        >
          <span>{t(key)}</span>
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
  const t = useTranslations("profileAnalysis");
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
      {t("privacy", { total })}
    </p>
  );
}

function OcrSummary({ value }: { value: Analysis["ocrSummary"] }) {
  const t = useTranslations("profileAnalysis");
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
    ? t("ocrStatus.applied")
    : reason === "runtime-unavailable" || reason === "failed"
      ? t("ocrStatus.failed")
      : mode === "off"
        ? t("ocrStatus.off")
        : t("ocrStatus.notNeeded");
  return (
    <p className="rounded-lg bg-[#eff6ff] p-3 text-xs text-[#1d4ed8]">
      {t("ocrSummary", { status, mode, language })}
    </p>
  );
}

function ProfileField({ label, values }: { label: string; values: string[] }) {
  const t = useTranslations("profileAnalysis");
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#99a1af]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[#4b5563]">
        {values.length ? values.join(" · ") : t("notSpecified")}
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
