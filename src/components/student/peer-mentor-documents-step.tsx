"use client";

import {
  Award,
  ChevronDown,
  CircleCheck,
  FileText,
  GraduationCap,
  Link2,
  Plus,
  Star,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, type ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";
import { ISKUR_FIELD_CLASS, Tag, TagTone } from "@/components/student/iskur-ui";
import {
  usePeerMentorDocumentsStep,
  type PeerMentorDocumentsStep as Step,
} from "@/hooks/use-peer-mentor-documents";
import {
  PeerDocumentVisibility,
  type PeerMentorDocument,
} from "@/interfaces/peer-mentor-documents";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import { isEnumValue } from "@/lib/enum";
import {
  OTHER_EVIDENCE_TYPES,
  PEER_EVIDENCE_ACCEPT,
  PEER_EVIDENCE_MAX_BYTES,
  requiringCategory,
} from "@/lib/peer-mentor-documents";
import { formatFileSize } from "@/lib/utils";
import {
  EvidenceCard,
  type EvidenceCardView,
} from "@/types/peer-mentor-evidence";

const CARD_ICON: Record<EvidenceCard, LucideIcon> = {
  [EvidenceCard.Transcript]: GraduationCap,
  [EvidenceCard.Cv]: FileText,
  [EvidenceCard.Certificate]: Award,
  [EvidenceCard.Portfolio]: Link2,
  [EvidenceCard.Other]: Star,
};

const VISIBILITIES = Object.values(PeerDocumentVisibility);

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-selected";

/**
 * The wizard's "Belgeler ve kanıtlar" step (Figma 110:719): the required-documents banner, one card per kind of
 * evidence with its visibility menu, and the note on who sees what.
 */
export function PeerMentorDocumentsStep({
  topics,
  linkedinUrl,
  onLinkedinChange,
}: {
  topics: readonly PeerTopicCategory[];
  linkedinUrl: string;
  onLinkedinChange: (value: string) => void;
}) {
  const t = useTranslations("iaIskur.wizard.documents");
  const step = usePeerMentorDocumentsStep({ topics, linkedinUrl });
  const loaded = !step.isLoading && !step.loadError;
  const linkedin = (
    <LinkedinField value={linkedinUrl} onChange={onLinkedinChange} />
  );

  return (
    <div className="space-y-6">
      {loaded ? <RequiredBanner step={step} /> : null}
      <QueryNotice isLoading={step.isLoading} error={step.loadError} />
      {/* LinkedIn belongs to the profile itself, so it stays reachable when the documents cannot load. */}
      {step.loadError ? (
        <section className="rounded-[20px] border border-border-subtle bg-background-surface p-5">
          {linkedin}
        </section>
      ) : null}
      {loaded
        ? step.cards.map((view) => (
            <EvidenceCardSection key={view.card} view={view} step={step}>
              {view.card === EvidenceCard.Portfolio ? (
                <PortfolioBody view={view} step={step} linkedin={linkedin} />
              ) : (
                <FilesBody view={view} step={step} />
              )}
            </EvidenceCardSection>
          ))
        : null}
      <InlineAlert tone={StatusTone.Info} title={t("safeTitle")}>
        {t("safeBody")}
      </InlineAlert>
    </div>
  );
}

function RequiredBanner({ step }: { step: Step }) {
  const t = useTranslations("iaIskur.wizard.documents");
  const tTopic = useTranslations("peerTopics");
  const { required } = step;
  return (
    <section
      aria-labelledby="evidence-progress"
      className="flex flex-wrap items-center gap-4 rounded-2xl bg-card-featured-bg p-4"
    >
      <Award aria-hidden className="size-5 shrink-0 text-text-accent" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p id="evidence-progress" className="type-label text-text-primary">
          {required.total > 0
            ? t("progress", { done: required.done, total: required.total })
            : t("noRequired")}
        </p>
        {required.cards.length > 0 ? (
          <p className="type-caption text-text-secondary">
            {required.cards
              .map(({ card, category }) =>
                t("progressItem", {
                  category: tTopic(category),
                  document: t(`kinds.${card}`),
                }),
              )
              .join(" · ")}
          </p>
        ) : null}
      </div>
      {required.total > 0 ? (
        <div
          role="progressbar"
          aria-labelledby="evidence-progress"
          aria-valuemin={0}
          aria-valuemax={required.total}
          aria-valuenow={required.done}
          className="h-2 w-full overflow-hidden rounded-full bg-background-surface sm:w-48"
        >
          <div
            className="h-2 rounded-full bg-text-accent"
            style={{ width: `${required.percent}%` }}
          />
        </div>
      ) : null}
    </section>
  );
}

function EvidenceCardSection({
  view,
  step,
  children,
}: {
  view: EvidenceCardView;
  step: Step;
  children: ReactNode;
}) {
  const t = useTranslations("iaIskur.wizard.documents");
  const tTopic = useTranslations("peerTopics");
  const headingId = useId();
  const Icon = CARD_ICON[view.card];
  const category = requiringCategory(view.card);
  const problem = step.problemOf(view.card);
  const hint = category
    ? t(
        view.card === EvidenceCard.Portfolio
          ? "hints.requiredIn"
          : "hints.requiredFor",
        { category: tTopic(category) },
      )
    : t(
        view.card === EvidenceCard.Certificate
          ? "hints.certificate"
          : "hints.other",
      );

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-4 rounded-[20px] border border-border-subtle bg-background-surface p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background-subtle">
          <Icon aria-hidden className="size-5 text-text-secondary" />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={headingId} className="type-title-card text-text-primary">
              {t(`kinds.${view.card}`)}
            </h2>
            {view.requiredFor ? (
              <span className="inline-flex h-8 items-center rounded-full bg-status-error-bg px-3 type-label-sm text-status-error-text">
                {t("required")}
              </span>
            ) : (
              <Tag>{t("optional")}</Tag>
            )}
          </div>
          <p className="type-caption text-text-muted">{hint}</p>
        </div>
        {view.done ? <Tag tone={TagTone.Success}>{t("uploaded")}</Tag> : null}
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 space-y-3">{children}</div>
        <VisibilityMenu view={view} step={step} />
      </div>
      {problem ? (
        <p role="alert" className="type-caption text-status-error-text">
          {problem}
        </p>
      ) : null}
    </section>
  );
}

function VisibilityMenu({
  view,
  step,
}: {
  view: EvidenceCardView;
  step: Step;
}) {
  const t = useTranslations("iaIskur.wizard.documents");
  return (
    <label className="relative inline-flex w-fit shrink-0 items-center">
      <span className="sr-only">
        {t("visibilityLabel", { card: t(`kinds.${view.card}`) })}
      </span>
      <select
        value={view.visibility}
        disabled={step.isChangingVisibility}
        onChange={(event) => {
          if (isEnumValue(PeerDocumentVisibility, event.target.value)) {
            step.setVisibility(view.card, event.target.value);
          }
        }}
        className={`h-9 appearance-none rounded-full border border-border-default bg-background-surface pr-9 pl-3 type-label text-text-primary disabled:text-text-disabled ${FOCUS_RING}`}
      >
        {VISIBILITIES.map((value) => (
          <option key={value} value={value}>
            {t(`visibility.${value}`)}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 size-4 text-text-secondary"
      />
    </label>
  );
}

function FilesBody({ view, step }: { view: EvidenceCardView; step: Step }) {
  const t = useTranslations("iaIskur.wizard.documents");
  const isOther = view.card === EvidenceCard.Other;
  return (
    <>
      {isOther ? <OtherKinds step={step} /> : null}
      {view.documents.map((item) => (
        <FileItem key={item.id} item={item} step={step} />
      ))}
      {view.documents.length === 0 ? (
        <DropZone view={view} step={step} />
      ) : (
        <AddFileButton
          view={view}
          step={step}
          label={t(isOther ? "addMaterial" : "choose")}
        />
      )}
    </>
  );
}

function OtherKinds({ step }: { step: Step }) {
  const t = useTranslations("iaIskur.wizard.documents");
  const name = useId();
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{t("otherKindsLabel")}</legend>
      {OTHER_EVIDENCE_TYPES.map((type) => {
        const picked = step.otherType === type;
        return (
          <label key={type} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              checked={picked}
              onChange={() => step.pickOtherType(type)}
              className="peer sr-only"
            />
            <span
              className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 type-label peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-border-selected ${
                picked
                  ? "border-border-selected bg-background-selected text-text-accent"
                  : "border-border-default bg-background-surface text-text-primary"
              }`}
            >
              {picked ? <CircleCheck aria-hidden className="size-4" /> : null}
              {t(`types.${type}`)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function FileItem({ item, step }: { item: PeerMentorDocument; step: Step }) {
  const t = useTranslations("iaIskur.wizard.documents");
  const name = item.originalFilename || t(`types.${item.evidenceType}`);
  return (
    <div className="flex w-full max-w-[360px] items-center gap-3 rounded-2xl border border-border-default bg-background-surface p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background-selected">
        <FileText aria-hidden className="size-5 text-text-accent" />
      </span>
      <span className="min-w-0 flex-1">
        <a
          href={step.contentHref(item.id)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("viewFile", { name })}
          className={`block truncate type-label text-text-primary hover:underline ${FOCUS_RING}`}
        >
          {name}
        </a>
        <span className="block type-caption text-text-secondary">
          {t("fileMeta", { size: formatFileSize(item.sizeBytes ?? 0) })}
        </span>
      </span>
      <CircleCheck
        aria-hidden
        className="size-5 shrink-0 text-status-success-icon"
      />
      <button
        type="button"
        onClick={() => step.remove(item.id)}
        aria-label={t("removeFile", { name })}
        className={`grid size-7 shrink-0 place-items-center rounded-full text-text-muted hover:bg-background-subtle hover:text-text-primary ${FOCUS_RING}`}
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function DropZone({ view, step }: { view: EvidenceCardView; step: Step }) {
  const t = useTranslations("iaIskur.wizard.documents");
  const inputId = useId();
  const uploading = step.uploadingCard === view.card;
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        step.pickFile(view.card, event.dataTransfer.files[0]);
      }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-background-subtle px-4 py-6 text-center focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-border-selected"
    >
      <span className="grid size-10 place-items-center rounded-full bg-background-surface">
        <Upload aria-hidden className="size-4 text-text-accent" />
      </span>
      {uploading ? (
        <p role="status" className="type-body-sm text-text-primary">
          {t("uploading")}
        </p>
      ) : (
        <p className="type-body-sm text-text-primary">
          {t("drop")}{" "}
          <label
            htmlFor={inputId}
            className="cursor-pointer type-label text-text-accent hover:underline"
          >
            {t("choose")}
          </label>
        </p>
      )}
      <p className="type-caption text-text-secondary">
        {t("formats", { max: formatFileSize(PEER_EVIDENCE_MAX_BYTES) })}
      </p>
      <input
        id={inputId}
        type="file"
        accept={PEER_EVIDENCE_ACCEPT}
        className="sr-only"
        disabled={step.isUploading}
        onChange={(event) => {
          step.pickFile(view.card, event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function AddFileButton({
  view,
  step,
  label,
}: {
  view: EvidenceCardView;
  step: Step;
  label: string;
}) {
  const t = useTranslations("iaIskur.wizard.documents");
  const input = useRef<HTMLInputElement>(null);
  const uploading = step.uploadingCard === view.card;
  return (
    <>
      <button
        type="button"
        disabled={step.isUploading}
        onClick={() => input.current?.click()}
        className={`inline-flex items-center gap-1 type-label-sm text-text-accent hover:underline disabled:text-text-disabled ${FOCUS_RING}`}
      >
        <Plus aria-hidden className="size-4" />
        {label}
      </button>
      {uploading ? (
        <p role="status" className="type-caption text-text-secondary">
          {t("uploading")}
        </p>
      ) : null}
      {/* Opened by the button above; hidden from assistive tech so it is not reached twice. */}
      <input
        ref={input}
        type="file"
        accept={PEER_EVIDENCE_ACCEPT}
        aria-label={label}
        className="hidden"
        onChange={(event) => {
          step.pickFile(view.card, event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );
}

function LinkedinField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("iaIskur.wizard.documents");
  return (
    <label className="block space-y-2">
      <span className="type-label text-text-primary">{t("linkedin")}</span>
      <input
        className={ISKUR_FIELD_CLASS}
        inputMode="url"
        value={value}
        placeholder={t("linkedinPlaceholder")}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PortfolioBody({
  view,
  step,
  linkedin,
}: {
  view: EvidenceCardView;
  step: Step;
  linkedin: ReactNode;
}) {
  const t = useTranslations("iaIskur.wizard.documents");
  return (
    <>
      {linkedin}
      {view.documents.length > 0 ? (
        <ul className="space-y-2">
          {view.documents.map((item) => {
            const href = step.linkHref(item.url);
            return (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-input border border-border-subtle px-3 py-2"
              >
                <Link2
                  aria-hidden
                  className="size-4 shrink-0 text-text-muted"
                />
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={`min-w-0 flex-1 truncate type-body-sm text-text-link hover:underline ${FOCUS_RING}`}
                  >
                    {href}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 truncate type-body-sm text-text-secondary">
                    {item.url}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => step.remove(item.id)}
                  aria-label={t("removeLink", { url: item.url ?? "" })}
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-text-muted hover:bg-background-subtle hover:text-text-primary ${FOCUS_RING}`}
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <label className="block space-y-2">
        <span className="type-label text-text-primary">{t("portfolio")}</span>
        <input
          className={ISKUR_FIELD_CLASS}
          inputMode="url"
          value={step.linkDraft}
          placeholder={t("portfolioPlaceholder")}
          onChange={(event) => step.setLinkDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds the link here instead of submitting the wizard's step.
            if (event.key === "Enter") {
              event.preventDefault();
              step.addLink();
            }
          }}
        />
      </label>
      <button
        type="button"
        onClick={step.addLink}
        disabled={step.isAddingLink}
        className={`inline-flex items-center gap-1 type-label-sm text-text-accent hover:underline disabled:text-text-disabled ${FOCUS_RING}`}
      >
        <Plus aria-hidden className="size-4" />
        {step.isAddingLink ? t("addingLink") : t("addLink")}
      </button>
    </>
  );
}
