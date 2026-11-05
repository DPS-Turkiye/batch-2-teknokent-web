"use client";

import { useTranslations } from "next-intl";
import { fieldClass, labelClass } from "@/components/common/form-field";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { useProfileAnalysisEditor } from "@/hooks/use-profile-analysis-editor";
import {
  ProfileAnalysisType,
  type ProfileAnalysis,
} from "@/interfaces/profile-analysis";
import {
  profileFields,
  technologyInferences,
  toProfileObject,
} from "@/lib/profile-analysis";

export function ProfileAnalysisEditor({
  analysis,
  onSaved,
}: {
  analysis?: ProfileAnalysis;
  onSaved: (value: ProfileAnalysis) => void;
}) {
  const t = useTranslations("profileAnalysis");
  const fields = useTranslations("profileAnalysis.fields");
  const labels = useTranslations("profileTools");
  const form = useProfileAnalysisEditor({ analysis, onSaved });
  const suggestions = technologyInferences(toProfileObject(analysis?.profile));
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.save();
      }}
    >
      <div>
        <h3 className="text-sm font-semibold text-[#22262b]">
          {analysis ? t("review") : t("manualTitle")}
        </h3>
        <p className="mt-1 text-xs text-[#676e78]">
          {analysis ? t("reviewHint") : t("manualHint")}
        </p>
      </div>
      {suggestions.length ? (
        <div className="rounded-xl border border-[#fde4d3] bg-[#fff9f5] p-3.5 text-sm text-[#4a5059]">
          <p className="font-medium text-[#c85816]">{t("suggestions")}</p>
          <p className="mt-0.5 text-xs text-[#676e78]">
            {t("suggestionsHint")}
          </p>
          <ul className="mt-2.5 space-y-2">
            {suggestions.map((item) => (
              <li key={item.tag} className="text-xs">
                <span className="mr-2 inline-flex rounded-full bg-white px-2 py-0.5 font-medium text-[#c85816] ring-1 ring-[#fde4d3]">
                  {item.tag}
                </span>
                <span className="text-[#676e78]">{item.evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <fieldset disabled={form.isPending} className="grid gap-3 sm:grid-cols-2">
        {profileFields(ProfileAnalysisType.Startup).map(([key, kind]) => (
          <label
            key={key}
            className={`${labelClass} ${kind === "textarea" ? "sm:col-span-2" : ""}`}
          >
            {fields(key)}
            {kind === "textarea" ? (
              <textarea
                className={`${fieldClass} mt-1.5 min-h-24 py-2.5`}
                value={form.draft[key] ?? ""}
                onChange={(event) =>
                  form.setDraft({ ...form.draft, [key]: event.target.value })
                }
              />
            ) : (
              <input
                className={`${fieldClass} mt-1.5`}
                value={form.draft[key] ?? ""}
                onChange={(event) =>
                  form.setDraft({ ...form.draft, [key]: event.target.value })
                }
              />
            )}
          </label>
        ))}
      </fieldset>
      {form.error ? (
        <p role="alert" className="text-sm text-[#b91c1c]">
          {form.error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <SecondaryButton onClick={form.clear} disabled={form.isPending}>
          {labels("clear")}
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={form.isPending}>
          {form.isPending
            ? t("saving")
            : analysis
              ? t("confirm")
              : t("confirmManual")}
        </PrimaryButton>
      </div>
    </form>
  );
}
