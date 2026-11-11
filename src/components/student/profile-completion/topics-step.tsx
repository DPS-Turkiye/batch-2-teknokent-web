"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { Card } from "@/components/ia/card";
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
  const t = useTranslations("iaProfile.topicsStep");
  const tCatalogue = useTranslations("studentProfileCompletion");
  const topicLabel = useTranslations("peerTopics");
  return (
    <>
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      {categories.length === 0 ? (
        <p className="rounded-[16px] bg-background-subtle p-4 type-body text-text-secondary">
          {tCatalogue("noActiveCategories")}
        </p>
      ) : (
        <fieldset className="min-w-0">
          <legend className="sr-only">{t("title")}</legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((item) => {
              const checked = topics.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-[16px] border bg-background-surface p-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-border-selected ${
                    checked
                      ? "border-border-selected"
                      : "border-border-default hover:bg-background-subtle"
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
                      checked ? "bg-background-surface" : "bg-background-subtle"
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
      )}
      <Card labelledBy="completion-subtopics" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2
            id="completion-subtopics"
            className="type-title-card text-text-primary"
          >
            {t("subtopicsTitle")}
          </h2>
          <span className="type-caption text-text-muted">{t("optional")}</span>
        </div>
        {groups.length === 0 ? (
          <p className="type-body text-text-secondary">{t("pickFirst")}</p>
        ) : (
          groups.map((group) => (
            <fieldset key={group.id} className="flex min-w-0 flex-col">
              <legend className="mb-3 type-label-sm text-text-secondary">
                {topicLabel(group.id)}
              </legend>
              <div className="flex flex-wrap gap-2">
                {group.subtopics.map((sub) => {
                  const checked = subtopics.includes(sub.id);
                  return (
                    <label
                      key={sub.id}
                      className={`inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border px-3 type-label focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-border-selected ${
                        checked
                          ? "border-border-selected bg-background-selected text-text-accent"
                          : "border-border-default bg-background-surface text-text-primary hover:bg-background-subtle"
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
                      {tCatalogue(`subtopics.${sub.labelKey}`)}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))
        )}
      </Card>
    </>
  );
}
