"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import { usePeerMentorRequestForm } from "@/hooks/use-peer-mentoring";
import type {
  PeerMentorCard,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";

const fieldClass =
  "w-full rounded-xl border border-[#d4d8dd] bg-white px-3 py-2 text-[13px]! text-[#22262b]";

export function PeerMentorRequestDialog({
  mentor,
  onClose,
}: {
  mentor: PeerMentorCard;
  onClose: () => void;
}) {
  const t = useTranslations("odtuWorkspaces.student.peerMentoring.dialog");
  const tTopic = useTranslations("peerTopics");
  const form = usePeerMentorRequestForm(mentor, onClose);

  return (
    <ModalDialog labelledBy="peer-request-title" onClose={onClose}>
      <form
        className="flex flex-col gap-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void form.submit();
        }}
      >
        <div>
          <h2
            id="peer-request-title"
            className="text-[19px] font-semibold text-[#22262b]"
          >
            {t("title", { name: mentor.fullName })}
          </h2>
          <p className="mt-1 text-[12.5px] text-[#676e78]">{t("subtitle")}</p>
        </div>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-[#4a5059]">
          {t("category")}
          <select
            value={form.category}
            onChange={(event) =>
              form.setCategory(event.target.value as PeerTopicCategory)
            }
            className={`${fieldClass} h-10`}
          >
            {mentor.categories.map((category) => (
              <option key={category} value={category}>
                {tTopic(category)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-[#4a5059]">
          {t("message")}
          <textarea
            value={form.message}
            onChange={(event) => form.setMessage(event.target.value)}
            maxLength={form.maxLength}
            rows={5}
            placeholder={t("messagePlaceholder")}
            className={fieldClass}
          />
        </label>
        {form.error ? (
          <p role="alert" className="text-[12px] text-[#a65a15]">
            {form.error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d4d8dd] bg-white px-[18px] py-2.5 text-[12.5px]! font-medium! text-[#4a5059]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={form.isSending}
            className="rounded-full bg-[#22262b] px-[18px] py-2.5 text-[12.5px]! font-medium! text-white disabled:opacity-50"
          >
            {form.isSending ? t("sending") : t("send")}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
