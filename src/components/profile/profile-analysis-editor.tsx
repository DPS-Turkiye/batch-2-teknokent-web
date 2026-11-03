"use client";

import { useTranslations } from "next-intl";
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
      <h3 className="text-base font-semibold text-[#22262b]">
        {analysis ? t("review") : t("manualTitle")}
      </h3>
      <p className="text-sm text-[#676e78]">
        {analysis ? t("reviewHint") : t("manualHint")}
      </p>
      {suggestions.length ? (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{t("suggestions")}</p>
          <p>{t("suggestionsHint")}</p>
          <ul className="mt-2 space-y-2">
            {suggestions.map((item) => (
              <li key={item.tag}>
                <strong>{item.tag}</strong>
                <p>{item.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <fieldset disabled={form.isPending} className="space-y-3">
        {profileFields(ProfileAnalysisType.Startup).map(([key, kind]) => (
          <label key={key} className="block text-sm font-medium text-[#4a5059]">
            {fields(key)}
            {kind === "textarea" ? (
              <textarea
                className="mt-1 min-h-24 w-full rounded-xl border border-[#d4d8dd] px-3 py-2 font-normal"
                value={form.draft[key] ?? ""}
                onChange={(event) =>
                  form.setDraft({ ...form.draft, [key]: event.target.value })
                }
              />
            ) : (
              <input
                className="mt-1 w-full rounded-xl border border-[#d4d8dd] px-3 py-2 font-normal"
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
        <p role="alert" className="text-sm text-[#b42318]">
          {form.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={form.clear}
          disabled={form.isPending}
          className="rounded-full border border-[#d4d8dd] px-4 py-2 text-sm"
        >
          {labels("clear")}
        </button>
        <button
          type="submit"
          disabled={form.isPending}
          className="rounded-full bg-[#e86f22] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {form.isPending
            ? t("saving")
            : analysis
              ? t("confirm")
              : t("confirmManual")}
        </button>
      </div>
    </form>
  );
}
