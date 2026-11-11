import Image from "next/image";
import type { ReactNode } from "react";

import { StatusTone } from "@/components/ia/status-badge";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";

/*
 * Pieces of the IA Revizyon kit (Figma 78:3) that the İŞKUR screens need and `components/ia` does not have yet:
 * underline tabs with a count, the vertical "Mentor olma adımları" list, the info card, the initials avatar and the
 * 32px tag. They use the kit's tokens, so they can move into `components/ia` unchanged.
 */

/** A request's status as the mentor sees it; a waiting request never shares Accepted's tone. */
export const REQUEST_STATUS_TONE: Record<MentorshipRequestStatus, StatusTone> =
  {
    [MentorshipRequestStatus.Pending]: StatusTone.Warning,
    [MentorshipRequestStatus.MoreInfoRequested]: StatusTone.Info,
    [MentorshipRequestStatus.CounterProposed]: StatusTone.Info,
    [MentorshipRequestStatus.Accepted]: StatusTone.Success,
    [MentorshipRequestStatus.Declined]: StatusTone.Error,
    [MentorshipRequestStatus.Withdrawn]: StatusTone.Neutral,
  };

export function HourglassIcon() {
  return <Image src="/ia/iskur/hourglass.svg" alt="" width={16} height={16} />;
}

export enum TagTone {
  Neutral = "neutral",
  Success = "success",
  Accent = "accent",
}

const TAG_TONES: Record<TagTone, string> = {
  [TagTone.Neutral]: "bg-status-neutral-bg text-status-neutral-text",
  [TagTone.Success]: "bg-status-success-bg text-status-success-text",
  [TagTone.Accent]: "bg-background-selected text-text-accent",
};

/** A category or expertise label (Figma "Tag", 32px). */
export function Tag({
  tone = TagTone.Neutral,
  children,
}: {
  tone?: TagTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-3 type-label-sm ${TAG_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function InitialsAvatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full bg-background-selected type-label text-text-accent"
    >
      {initials}
    </span>
  );
}

export type UnderlineTab<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

export function tabId(prefix: string, id: string) {
  return `${prefix}-tab-${id}`;
}

export function panelId(prefix: string, id: string) {
  return `${prefix}-panel-${id}`;
}

/** Underline tabs (Figma "Tab", 44px) with an optional count; each panel is labelled by its tab. */
export function UnderlineTabs<T extends string>({
  label,
  tabs,
  selected,
  onSelect,
  idPrefix,
}: {
  label: string;
  tabs: readonly UnderlineTab<T>[];
  selected: T;
  onSelect: (id: T) => void;
  idPrefix: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-border-subtle"
    >
      {tabs.map((tab) => {
        const active = tab.id === selected;
        return (
          <button
            key={tab.id}
            id={tabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId(idPrefix, tab.id)}
            onClick={() => onSelect(tab.id)}
            className={`flex min-w-max flex-1 flex-col items-center ${
              active ? "text-text-accent" : "text-text-secondary"
            }`}
          >
            <span className="flex h-11 items-center gap-2 px-2 type-label">
              {tab.label}
              {tab.count === undefined ? null : (
                <span
                  className={`rounded-full px-2 py-0.5 type-label-sm ${
                    active ? "bg-background-selected" : "bg-background-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
            <span
              aria-hidden
              className={`h-0.5 w-full rounded-[1px] ${active ? "bg-action-accent" : ""}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export type JourneyStep = { key: string; title: string; hint: string };

/** "Mentor olma adımları": a vertical numbered list in a card, the current step filled (Figma 85:404). */
export function JourneySteps({
  heading,
  steps,
  current,
}: {
  heading: string;
  steps: readonly JourneyStep[];
  current: number;
}) {
  return (
    <div className="w-full rounded-[20px] bg-background-surface p-6 lg:w-[440px] lg:shrink-0">
      <p className="type-overline text-text-muted uppercase">{heading}</p>
      <ol aria-label={heading}>
        {steps.map((step, index) => {
          const active = index === current;
          return (
            <li
              key={step.key}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-3.5 py-3.5"
            >
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-full type-label-sm ${
                  active
                    ? "bg-brand-mentor-primary text-text-inverse"
                    : "bg-background-muted text-text-muted"
                }`}
              >
                {index + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className={`type-label ${active ? "text-text-primary" : "text-text-secondary"}`}
                >
                  {step.title}
                </span>
                <span className="type-caption text-text-muted">
                  {step.hint}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** A small card with an icon, a title and a sentence (the three cards under Rozet Yok). */
export function InfoCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[20px] border border-border-subtle bg-background-surface p-5">
      <h3 className="flex items-center gap-2.5 type-title-card text-text-primary">
        <Image src={icon} alt="" width={18} height={18} />
        {title}
      </h3>
      <p className="type-body-sm text-text-secondary">{children}</p>
    </div>
  );
}
