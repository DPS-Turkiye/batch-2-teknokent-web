// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { QueryNotice } from "@/components/admin/admin-ui";
import { useProgramPeerCategories } from "@/hooks/use-program-peer-categories";
import { PEER_TOPIC_CATEGORIES } from "@/interfaces/peer-mentoring";

/**
 * The body of Program Ayarları › Akran kategorileri. None is active until the coordinator turns it on; students
 * and peer mentors only see the active ones. Saved on its own, apart from "Değişiklikleri kaydet".
 */
export function ProgramPeerCategories({
  programId,
  readOnly,
}: {
  programId: string;
  readOnly: boolean;
}) {
  const t = useTranslations("programPeerCategories");
  const tTopic = useTranslations("peerTopics");
  const categories = useProgramPeerCategories(programId);

  return (
    <div className="space-y-4">
      {categories.isLoading || categories.error ? (
        <QueryNotice
          isLoading={categories.isLoading}
          error={categories.error}
        />
      ) : (
        <>
          <fieldset className="grid gap-2.5 sm:grid-cols-2">
            <legend className="sr-only">{t("title")}</legend>
            {PEER_TOPIC_CATEGORIES.map((category) => (
              <label
                key={category}
                className="flex items-center gap-3 rounded-2xl border border-[#e9ecef] px-4 py-3 text-[13.5px] text-[#22262b]"
              >
                <input
                  type="checkbox"
                  checked={categories.active.includes(category)}
                  disabled={readOnly || categories.saving}
                  onChange={() => categories.toggle(category)}
                />
                {tTopic(category)}
              </label>
            ))}
          </fieldset>
          {categories.active.length === 0 ? (
            <p className="rounded-2xl bg-[#fff6e5] px-4 py-3 text-[12.5px] text-[#b7791f]">
              {t("noneActive")}
            </p>
          ) : (
            <p className="text-[12.5px] text-[#676e78]">
              {t("activeCount", { count: categories.active.length })}
            </p>
          )}
          {readOnly ? null : (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={!categories.dirty || categories.saving}
                onClick={categories.reset}
                className="rounded-full border border-[#e9ecef] px-4 py-2 text-[13px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={!categories.dirty || categories.saving}
                onClick={categories.save}
                className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
              >
                {categories.saving ? t("saving") : t("save")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
