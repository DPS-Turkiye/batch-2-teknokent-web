"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { StepHeading } from "@/components/student/profile-completion/welcome-step";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import type { ProfileCompletionCategory } from "@/interfaces/student-profile-completion";
import { PEER_TOPIC_ICONS } from "@/lib/profile-completion";

/** Step 2 (Figma "Profil Tamamlama — 2 · Destek konuları"): topic cards, then the chosen topics' sub-topics. */
export function TopicsStep({
  categories,
  groups,
  topics,
  subtopics,
  onToggleTopic,
  onToggleSubtopic,
}: {
  categories: ProfileCompletionCategory[];
  groups: ProfileCompletionCategory[];
  topics: readonly PeerTopicCategory[];
  subtopics: readonly string[];
  onToggleTopic: (id: PeerTopicCategory) => void;
  onToggleSubtopic: (id: string) => void;
}) {
  const t = useTranslations("studentProfileCompletion");
  const topicLabel = useTranslations("peerTopics");
  return (
    <>
      <StepHeading
        title={t("topicsStep.title")}
        subtitle={t("topicsStep.subtitle")}
      />
      {categories.length === 0 ? (
        <p className="rounded-[16px] bg-[#f4f6f8] p-4 text-sm text-[#575f69]">
          {t("noActiveCategories")}
        </p>
      ) : (
        <fieldset className="min-w-0">
          <legend className="sr-only">{t("topicsStep.title")}</legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((item) => {
              const checked = topics.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-[16px] border p-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1c2026] ${
                    checked
                      ? "border-[#d0112b] bg-white"
                      : "border-[#dce1e6] bg-white hover:bg-[#f4f6f8]"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => onToggleTopic(item.id)}
                  />
                  <span
                    aria-hidden
                    className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${
                      checked ? "bg-white" : "bg-[#f4f6f8]"
                    }`}
                  >
                    <Image
                      src={PEER_TOPIC_ICONS[item.id]}
                      alt=""
                      width={18}
                      height={18}
                    />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium leading-5 tracking-[-0.014px] text-[#1c2026]">
                    {topicLabel(item.id)}
                  </span>
                  {checked ? (
                    <span
                      aria-hidden
                      className="grid size-5 shrink-0 place-items-center rounded-full bg-[#d0112b]"
                    >
                      <Image
                        src="/ia/profile/check-badge.svg"
                        alt=""
                        width={12}
                        height={12}
                      />
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      <section
        aria-labelledby="completion-subtopics"
        className="flex flex-col gap-3 rounded-[20px] border border-[#e5e9ed] bg-white p-6"
      >
        <div className="flex items-center gap-2">
          <h2
            id="completion-subtopics"
            className="text-base font-bold leading-[22px] tracking-[-0.032px] text-[#1c2026]"
          >
            {t("topicsStep.subtopicsTitle")}
          </h2>
          <span className="text-xs leading-4 text-[#6e7681]">
            {t("topicsStep.optional")}
          </span>
        </div>
        {groups.length === 0 ? (
          <p className="text-sm text-[#575f69]">{t("topicsStep.pickFirst")}</p>
        ) : (
          groups.map((group) => (
            <fieldset key={group.id} className="flex min-w-0 flex-col gap-3">
              <legend className="mb-3 text-xs font-medium leading-4 text-[#575f69]">
                {topicLabel(group.id)}
              </legend>
              <div className="flex flex-wrap gap-2">
                {group.subtopics.map((sub) => {
                  const checked = subtopics.includes(sub.id);
                  return (
                    <label
                      key={sub.id}
                      className={`inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border px-3 text-sm font-medium leading-5 tracking-[-0.014px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1c2026] ${
                        checked
                          ? "border-[#d0112b] bg-[#fdedef] text-[#d0112b]"
                          : "border-[#dce1e6] bg-white text-[#1c2026] hover:bg-[#f4f6f8]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => onToggleSubtopic(sub.id)}
                      />
                      {checked ? (
                        <Image
                          src="/ia/profile/chip-check.svg"
                          alt=""
                          width={16}
                          height={16}
                        />
                      ) : null}
                      {t(`subtopics.${sub.labelKey}`)}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))
        )}
      </section>
    </>
  );
}
