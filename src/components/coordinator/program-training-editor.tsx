// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

import { useTrainingEditor } from "@/hooks/use-training-editor";
import { TRAINING_OPTION_COUNT } from "@/interfaces/training";
import { errorMessage, formatDateTime } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-[#e4e7ea] px-3 py-2 text-sm disabled:bg-[#f8f9fa]";

/**
 * The peer program's Akran Mentoru training: a YouTube link and ten questions with four options each, one marked
 * correct. "Kaydet ve yayınla" publishes; any change starts a new version, which students begin again on.
 */
export function ProgramTrainingEditor({
  programId,
  archived,
}: {
  programId: string;
  archived: boolean;
}) {
  const t = useTranslations("trainingEditor");
  const locale = useLocale();
  const editor = useTrainingEditor(programId);
  const linkId = useId();
  const draft = editor.draft;

  if (editor.isLoading || !draft) {
    return editor.loadError ? (
      <p role="alert" className="text-sm text-red-700">
        {errorMessage(editor.loadError, t("loadFailed"))}
      </p>
    ) : (
      <p role="status" className="text-sm text-[#676e78]">
        {t("loading")}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {editor.module?.placeholder ? (
        <p className="rounded-2xl bg-[#fff6e5] px-4 py-3 text-[13px] text-[#8a5a00]">
          {t("placeholderNote")}
        </p>
      ) : (
        <p className="text-[13px] text-[#676e78]">
          {t("publishedNote", {
            version: editor.module?.version ?? 1,
            date: editor.module?.updatedAt
              ? formatDateTime(editor.module.updatedAt, locale)
              : "",
          })}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor={linkId} className="block text-sm font-medium">
          {t("videoLink")}
        </label>
        <input
          id={linkId}
          type="url"
          value={draft.videoUrl}
          disabled={archived}
          aria-describedby={`${linkId}-hint`}
          onChange={(event) => editor.setVideoUrl(event.target.value)}
          className={inputClass}
        />
        <p id={`${linkId}-hint`} className="text-xs text-[#858c96]">
          {t("videoHint")}
        </p>
      </div>

      <ol className="space-y-4">
        {draft.questions.map((question, index) => (
          <li
            key={index}
            className="space-y-2 rounded-2xl border border-[#eceef0] p-4"
          >
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                {t("question", { number: index + 1 })}
              </span>
              <input
                value={question.text}
                disabled={archived}
                maxLength={500}
                onChange={(event) =>
                  editor.setQuestionText(index, event.target.value)
                }
                className={inputClass}
              />
            </label>
            <fieldset className="space-y-1.5">
              <legend className="text-xs text-[#858c96]">
                {t("optionsLegend")}
              </legend>
              {Array.from({ length: TRAINING_OPTION_COUNT }, (_, option) => (
                <div key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${index}`}
                    checked={question.correctOption === option}
                    disabled={archived}
                    onChange={() => editor.setCorrectOption(index, option)}
                    aria-label={t("markCorrect", {
                      question: index + 1,
                      option: option + 1,
                    })}
                  />
                  <input
                    value={question.options[option]}
                    disabled={archived}
                    maxLength={200}
                    aria-label={t("option", {
                      question: index + 1,
                      option: option + 1,
                    })}
                    onChange={(event) =>
                      editor.setOption(index, option, event.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              ))}
            </fieldset>
          </li>
        ))}
      </ol>

      {editor.saveError ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage(editor.saveError, t("saveFailed"))}
        </p>
      ) : null}
      {editor.saved ? (
        <p role="status" className="text-sm text-[#008236]">
          {t("saved")}
        </p>
      ) : null}
      {archived ? null : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={editor.save}
            disabled={editor.isSaving}
            className="rounded-full bg-[#22262b] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {editor.isSaving ? t("saving") : t("saveAndPublish")}
          </button>
        </div>
      )}
    </div>
  );
}
