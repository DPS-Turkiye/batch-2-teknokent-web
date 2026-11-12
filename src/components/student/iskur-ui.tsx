import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import type { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { PEER_REQUEST_STATUS_TONE } from "@/lib/peer-mentoring";

/*
 * Pieces the İŞKUR screens need that `components/ia` does not have yet: underline tabs with a count, the vertical
 * "Mentor olma adımları" list, the info card, the initials avatar, the 32px tag and the request status badge. They use
 * the kit's tokens, so they can move into `components/ia` unchanged.
 */

/** The kit tone for each of the older status-chip tones, so request statuses keep one table (PEER_REQUEST_STATUS_TONE). */
const KIT_TONE = {
  green: StatusTone.Success,
  amber: StatusTone.Warning,
  red: StatusTone.Error,
  neutral: StatusTone.Neutral,
  blue: StatusTone.Info,
  orange: StatusTone.Warning,
} as const;

/** A peer request's status, with the hourglass while it waits. */
export function RequestStatusBadge({
  status,
}: {
  status: MentorshipRequestStatus;
}) {
  const t = useTranslations("iaIskur.requestStatus");
  const tone = KIT_TONE[PEER_REQUEST_STATUS_TONE[status]];
  return (
    <StatusBadge
      tone={tone}
      icon={
        tone === StatusTone.Warning ? (
          <Image src="/ia/iskur/hourglass.svg" alt="" width={16} height={16} />
        ) : undefined
      }
    >
      {t(status)}
    </StatusBadge>
  );
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

/** A category or expertise label (32px). */
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

export function InitialsAvatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-background-selected text-text-accent ${
        size === "lg" ? "size-[72px] type-h3" : "size-10 type-label"
      }`}
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

/**
 * Underline tabs (44px) with an optional count, following the WAI-ARIA tabs pattern: one tab in the tab order, arrow
 * keys and Home/End move between tabs. The panels stay rendered (hidden when inactive), so every `aria-controls`
 * points at a real panel.
 */
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
  const buttons = useRef(new Map<T, HTMLButtonElement>());
  const move = (event: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const target =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    const tab = target === null ? undefined : tabs[target];
    if (!tab) return;
    event.preventDefault();
    onSelect(tab.id);
    buttons.current.get(tab.id)?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-border-subtle"
    >
      {tabs.map((tab, index) => {
        const active = tab.id === selected;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              if (element) buttons.current.set(tab.id, element);
              else buttons.current.delete(tab.id);
            }}
            id={tabId(idPrefix, tab.id)}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId(idPrefix, tab.id)}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => move(event, index)}
            className={`flex min-w-max flex-1 flex-col items-center rounded-t-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-selected ${
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

/** One tab's panel; inactive panels stay mounted but hidden, so their state (an unsaved draft) survives a switch. */
export function TabPanel({
  idPrefix,
  id,
  selected,
  children,
}: {
  idPrefix: string;
  id: string;
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={panelId(idPrefix, id)}
      aria-labelledby={tabId(idPrefix, id)}
      hidden={!selected}
      tabIndex={0}
      className="space-y-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-selected"
    >
      {children}
    </div>
  );
}

export type JourneyStep = { key: string; title: string; hint: string };

/** "Mentor olma adımları": a vertical numbered list in a card, the current step filled. */
export function JourneySteps({
  heading,
  steps,
  currentKey,
}: {
  heading: string;
  steps: readonly JourneyStep[];
  currentKey: string;
}) {
  return (
    <div className="w-full rounded-[20px] bg-background-surface p-6 lg:w-[440px] lg:shrink-0">
      <p className="type-overline text-text-muted uppercase">{heading}</p>
      <ol aria-label={heading}>
        {steps.map((step, index) => {
          const active = step.key === currentKey;
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
