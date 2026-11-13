"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import type { ProfileCompletionCategory } from "@/interfaces/student-profile-completion";
import { PEER_TOPIC_ICONS } from "@/lib/profile-completion";

export const STUDENT_GOAL_MAX = 1000;

/**
 * The program's categories as selectable cards (Figma "Profil Tamamlama — 2 · Destek konuları", 79:255), for editing
 * the interests in place on Profilim. Same look as the completion step, without its page heading.
 */
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
  const tStep = useTranslations("iaProfile.topicsStep");
  if (categories.length === 0) {
    return (
      <p className="rounded-[16px] bg-background-subtle p-4 type-body text-text-secondary">
        {t("noActiveCategories")}
      </p>
    );
  }
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{tStep("title")}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-3 rounded-[16px] border bg-background-surface p-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-selected ${
                checked
                  ? "border-border-selected"
                  : "border-border-default hover:bg-background-subtle"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onToggle(item.id)}
              />
              <span
                aria-hidden
                className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${
                  checked ? "bg-background-selected" : "bg-background-subtle"
                }`}
              >
                <Image
                  src={PEER_TOPIC_ICONS[item.id]}
                  alt=""
                  width={18}
                  height={18}
                />
              </span>
              <span className="min-w-0 flex-1 type-label text-text-primary">
                {topicLabel(item.id)}
              </span>
              {checked ? (
                <span
                  aria-hidden
                  className="grid size-5 shrink-0 place-items-center rounded-full bg-action-primary-bg"
                >
                  <Image
                    src="/ia/icons/check-inverse.svg"
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
  );
}

/** The chosen categories' sub-topics as chips, grouped by category (79:255's "Alt konular"). */
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
  const tStep = useTranslations("iaProfile.topicsStep");
  const topicLabel = useTranslations("peerTopics");
  return (
    <section
      aria-labelledby="interest-subtopics"
      className="flex flex-col gap-3 rounded-card border border-border-default bg-background-surface p-5"
    >
      <div className="flex items-center gap-2">
        <h3
          id="interest-subtopics"
          className="type-title-card text-text-primary"
        >
          {tStep("subtopicsTitle")}
        </h3>
        <span className="type-caption text-text-muted">
          {tStep("optional")}
        </span>
      </div>
      {groups.length === 0 ? (
        <p className="type-body text-text-secondary">{tStep("pickFirst")}</p>
      ) : (
        groups.map((group) => (
          <fieldset key={group.id} className="flex min-w-0 flex-col">
            <legend className="mb-3 type-label-sm text-text-secondary">
              {topicLabel(group.id)}
            </legend>
            <div className="flex flex-wrap gap-2">
              {group.subtopics.map((sub) => {
                const checked = selected.includes(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border px-3 type-label has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-border-selected ${
                      checked
                        ? "border-border-selected bg-background-selected text-text-accent"
                        : "border-border-default bg-background-surface text-text-primary hover:bg-background-subtle"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => onToggle(sub.id)}
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
  );
}

/** The goal box with its limit and counter (Figma "Profil Tamamlama — 3 · Hedef", 79:445). */
export function GoalField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("iaProfile.goalStep");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="interest-goal" className="type-label text-text-primary">
        {t("label")}
      </label>
      <textarea
        id="interest-goal"
        aria-describedby="interest-goal-help"
        className="min-h-[120px] w-full rounded-input border border-border-control bg-background-elevated px-4 py-3 type-body text-text-primary placeholder:text-text-placeholder focus:border-border-selected focus:ring-[3px] focus:ring-background-selected focus:outline-none"
        maxLength={STUDENT_GOAL_MAX}
        placeholder={t("placeholder")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p
        id="interest-goal-help"
        className="flex items-center gap-1 type-caption"
      >
        <Image src="/ia/profile/info-alt.svg" alt="" width={16} height={16} />
        <span className="text-text-secondary">
          {t("limit", { max: STUDENT_GOAL_MAX })}
        </span>
        <span className="text-text-muted">
          {t("count", { count: value.length, max: STUDENT_GOAL_MAX })}
        </span>
      </p>
    </div>
  );
}
