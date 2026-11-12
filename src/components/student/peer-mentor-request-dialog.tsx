"use client";

import { Info, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";
import { usePeerMentorRequestForm } from "@/hooks/use-peer-mentoring";
import {
  PeerTopicCategory,
  type PeerMentorCard,
} from "@/interfaces/peer-mentoring";
import { isEnumValue } from "@/lib/enum";

const fieldClass =
  "w-full rounded-input border border-border-control bg-background-surface px-4 type-body text-text-primary placeholder:text-text-placeholder focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-selected";

/** "Mentorluk talebi gönder": one of the mentor's categories and a short message. */
export function PeerMentorRequestDialog({
  mentor,
  onClose,
}: {
  mentor: PeerMentorCard;
  onClose: () => void;
}) {
  const t = useTranslations("iaIskur.take.dialog");
  const tTopic = useTranslations("peerTopics");
  const form = usePeerMentorRequestForm(mentor, onClose);

  return (
    <ModalDialog
      labelledBy="peer-request-title"
      onClose={onClose}
      panelClassName="w-full max-w-[560px] rounded-[28px] bg-background-surface p-7 shadow-modal outline-none"
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void form.submit();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id="peer-request-title" className="type-h3 text-text-primary">
              {t("title")}
            </h2>
            <p className="type-body-sm text-text-secondary">
              {t("subtitle", { name: mentor.fullName })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid size-9 place-items-center rounded-full text-icon-default hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <label className="flex flex-col gap-2">
          <span className="type-label text-text-primary">
            {t("category")}{" "}
            <span aria-hidden className="text-text-accent">
              *
            </span>
          </span>
          <select
            value={form.category ?? ""}
            aria-required="true"
            onChange={(event) => {
              const { value } = event.target;
              if (isEnumValue(PeerTopicCategory, value))
                form.setCategory(value);
            }}
            className={`${fieldClass} h-12`}
          >
            {mentor.categories.map((category) => (
              <option key={category} value={category}>
                {tTopic(category)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="type-label text-text-primary">{t("message")}</span>
          <textarea
            value={form.message}
            onChange={(event) => form.setMessage(event.target.value)}
            maxLength={form.maxLength}
            rows={4}
            aria-describedby="peer-request-counter"
            placeholder={t("messagePlaceholder")}
            className={`${fieldClass} py-3`}
          />
        </label>
        <p
          id="peer-request-counter"
          className="-mt-3 flex items-center gap-1.5 type-caption text-text-muted"
        >
          <Info aria-hidden className="size-3.5 shrink-0" />
          {t("counter", {
            min: form.minLength,
            length: form.messageLength,
            max: form.maxLength,
          })}
        </p>
        {form.error ? (
          <InlineAlert tone={StatusTone.Error} title={form.error} />
        ) : null}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant={ButtonVariant.Ghost} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={form.isSending}>
            {form.isSending ? t("sending") : t("send")}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
