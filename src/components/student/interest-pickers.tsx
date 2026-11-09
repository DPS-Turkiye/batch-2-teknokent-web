"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";

import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import type { ProfileCompletionCategory } from "@/interfaces/student-profile-completion";

export const STUDENT_GOAL_MAX = 1000;

/** The board's categories as checkboxes; shared by profile completion and Profilim. */
export function TopicPicker({
  categories,
  selected,
  onToggle,
}: {
  categories: ProfileCompletionCategory[];
  selected: readonly PeerTopicCategory[];
  onToggle: (id: PeerTopicCategory) => void;
}) {
  const topicLabel = useTranslations("peerTopics");
  const t = useTranslations("studentProfileCompletion");
  if (categories.length === 0) {
    return (
      <p className="rounded-xl bg-[#f5f6f8] p-3 text-sm text-[#676e78]">
        {t("noActiveCategories")}
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((item) => (
        <label
          className="flex items-start gap-3 rounded-xl border p-3 text-sm"
          key={item.id}
        >
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => onToggle(item.id)}
          />
          <span>{topicLabel(item.id)}</span>
        </label>
      ))}
    </div>
  );
}

/** Sub-topics of the chosen categories (sample fixture IDs until the board names real ones). */
export function SubtopicPicker({
  groups,
  selected,
  onToggle,
}: {
  groups: ProfileCompletionCategory[];
  selected: readonly string[];
  onToggle: (id: string) => void;
}) {
  const t = useTranslations("studentProfileCompletion");
  const topicLabel = useTranslations("peerTopics");
  return (
    <>
      <p className="text-sm text-[#676e78]">{t("subtopicNotice")}</p>
      {groups.length === 0 ? (
        <p>{t("noTopics")}</p>
      ) : (
        groups.map((item) => (
          <fieldset key={item.id} className="space-y-2">
            <legend className="mb-2 font-medium">{topicLabel(item.id)}</legend>
            {item.subtopics.map((sub) => (
              <label key={sub.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(sub.id)}
                  onChange={() => onToggle(sub.id)}
                />
                {t(`subtopics.${sub.labelKey}`)}
              </label>
            ))}
          </fieldset>
        ))
      )}
    </>
  );
}

export function GoalField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("studentProfileCompletion");
  return (
    <label className="block space-y-2 text-sm">
      <span>{t("goal")}</span>
      <textarea
        className="min-h-32 w-full rounded-xl border p-3"
        maxLength={STUDENT_GOAL_MAX}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
