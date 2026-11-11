"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { MobileScreenHeader } from "@/components/mobile/mobile-app-shell";
import {
  MobileEmptyState,
  MobileErrorState,
  MobileListSkeleton,
} from "@/components/mobile/mobile-states";
import { useMobileMessages } from "@/hooks/use-mobile-messages";
import {
  MobileConversationKind,
  type MobileConversation,
} from "@/interfaces/mobile";

const AVATAR_CLASS = {
  program: "rounded-full bg-[#f0f1f3] text-[#676e78]",
  startup: "rounded-2xl bg-[#fff1ec] text-[#e0522a]",
  mentor: "rounded-full bg-[#eaf6ff] text-[#1583d6]",
};

const TAG_CLASS = {
  program: "text-[#858c96]",
  startup: "text-[#e0522a]",
  mentor: "text-[#1583d6]",
};

function ConversationRow({
  conversation,
  isMentor,
}: {
  conversation: MobileConversation;
  isMentor: boolean;
}) {
  const t = useTranslations("mobile.home");
  const unread = conversation.unreadCount > 0;
  const look =
    conversation.kind === MobileConversationKind.Program ||
    conversation.kind === MobileConversationKind.Announcement
      ? "program"
      : conversation.isStartup
        ? "startup"
        : "mentor";
  return (
    <li className="border-b border-[#f0f2f4] last:border-b-0">
      <Link
        href={conversation.href}
        className="flex items-center gap-3.5 py-3.5"
      >
        <span
          className={`flex size-[50px] shrink-0 items-center justify-center text-lg leading-[1.35] font-semibold ${AVATAR_CLASS[look]}`}
        >
          {conversation.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.35]">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={`max-w-full shrink-0 truncate text-[15.5px] text-[#22262b] ${
                unread ? "font-semibold" : "font-medium"
              }`}
            >
              {conversation.name}
            </span>
            {/* The name keeps its room; a long tag gives way first. */}
            <span
              className={`min-w-0 truncate text-[12.5px] ${TAG_CLASS[look]}`}
            >
              · {conversation.tag}
            </span>
          </span>
          <span
            className={`truncate text-sm ${
              unread ? "font-medium text-[#22262b]" : "text-[#858c96]"
            }`}
          >
            {conversation.preview}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2 self-start pt-0.5 leading-[1.35]">
          <span
            className={`text-[12.5px] ${
              unread
                ? `font-semibold ${isMentor ? "text-[#1583d6]" : "text-[#e0522a]"}`
                : "text-[#858c96]"
            }`}
          >
            {conversation.time}
          </span>
          {unread ? (
            <span
              className="rounded-full bg-[var(--mobile-accent)] px-[7px] py-0.5 text-[11.5px] font-semibold text-white"
              aria-label={t("unreadMessages", {
                count: conversation.unreadCount,
              })}
            >
              {conversation.unreadCount}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function MobileMessagesView() {
  const t = useTranslations("mobile.messages");
  const messages = useMobileMessages();

  return (
    <>
      <MobileScreenHeader title={t("title")} />
      <div className="flex flex-col gap-3.5">
        <label className="flex h-[46px] items-center gap-2.5 rounded-2xl bg-[#f5f6f8] px-4">
          <Image src="/mobile/icon-search.svg" alt="" width={20} height={20} />
          <span className="sr-only">{messages.searchLabel}</span>
          <input
            type="search"
            value={messages.query}
            onChange={(event) => messages.setQuery(event.target.value)}
            placeholder={messages.searchLabel}
            className="min-w-0 flex-1 bg-transparent text-[15px] leading-[1.35] text-[#22262b] outline-none placeholder:text-[#858c96] focus-visible:outline-none!"
          />
        </label>

        {messages.isLoading ? (
          <MobileListSkeleton />
        ) : messages.isError ? (
          <MobileErrorState title={t("loadError")} onRetry={messages.retry} />
        ) : messages.conversations.length === 0 ? (
          <MobileEmptyState
            icon="/mobile/icon-messages.svg"
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : messages.shown.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] leading-[1.35] text-[#858c96]">
            {t("noMatch", { query: messages.query })}
          </p>
        ) : (
          <ul aria-label={t("conversations")}>
            {messages.shown.map((conversation) => (
              <ConversationRow
                key={`${conversation.kind}-${conversation.id}`}
                conversation={conversation}
                isMentor={messages.isMentor}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
