import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { PrimaryButton } from "@/components/common/primary-button";
import type { RequestMessage } from "@/interfaces/mentorship-request";
import { withoutSlotLines } from "@/lib/mentor-availability-days";
import { formatDateTime } from "@/lib/utils";

export function ConversationThread({
  messages,
  viewerUserId,
  value,
  onChange,
  onSend,
  isSending,
  error,
}: {
  messages: RequestMessage[];
  viewerUserId: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  error?: Error | null;
}) {
  const t = useTranslations("conversation");
  const locale = useLocale();
  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <p className="text-xs text-zinc-500">{t("empty")}</p>
      ) : (
        <ul className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-[#f8f9fa] p-4">
          {messages.map((message) => {
            const isOwnMessage = message.authorId === viewerUserId;
            return (
              <li
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl border px-4 py-3 text-xs ${
                    isOwnMessage
                      ? "border-[#e86f22] bg-[#e86f22] text-white"
                      : "border-[#e4e7ea] bg-white text-[#22262b]"
                  }`}
                >
                  <div
                    className={`mb-1 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wide ${
                      isOwnMessage ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    <span>{message.authorName}</span>
                    <span>{formatDateTime(message.createdAt, locale)}</span>
                  </div>
                  <p>{withoutSlotLines(message.body)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <textarea
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("placeholder")}
          className="w-full rounded-2xl border border-[#dfe2e6] bg-white p-3 text-xs focus:border-[#e86f22] focus:outline-none"
        />
        {error ? (
          <p role="alert" className="text-xs text-red-700">
            {error.message}
          </p>
        ) : null}
        <div className="flex justify-end">
          <PrimaryButton disabled={!value.trim() || isSending} onClick={onSend}>
            {isSending ? t("sending") : t("send")}
            <Send className="size-3.5" />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
