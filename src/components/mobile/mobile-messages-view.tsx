"use client";

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

function ConversationRow({
  conversation,
}: {
  conversation: MobileConversation;
}) {
  const unread = conversation.unreadCount > 0;
  const isProgram = conversation.kind === MobileConversationKind.Program;
  return (
    <li className="border-b border-[#f0f2f4] last:border-b-0">
      <Link
        href={conversation.href}
        className="flex items-center gap-3.5 py-3.5"
      >
        <span
          className={`flex size-[50px] shrink-0 items-center justify-center rounded-full text-lg leading-[1.35] font-semibold ${
            isProgram
              ? "bg-[#f0f1f3] text-[#676e78]"
              : "bg-[#eaf6ff] text-[#1583d6]"
          }`}
        >
          {conversation.initials}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.35]">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={`truncate text-[15.5px] text-[#22262b] ${
                unread ? "font-semibold" : "font-medium"
              }`}
            >
              {conversation.name}
            </span>
            <span
              className={`shrink-0 text-[12.5px] ${
                isProgram ? "text-[#858c96]" : "text-[#1583d6]"
              }`}
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
              unread ? "font-semibold text-[#e0522a]" : "text-[#858c96]"
            }`}
          >
            {conversation.time}
          </span>
          {unread ? (
            <span
              className="rounded-full bg-[var(--mobile-accent)] px-[7px] py-0.5 text-[11.5px] font-semibold text-white"
              aria-label={`${conversation.unreadCount} okunmamış mesaj`}
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
  const messages = useMobileMessages();

  return (
    <>
      <MobileScreenHeader title="Mesajlar" />
      <div className="flex flex-col gap-3.5">
        <label className="flex h-[46px] items-center gap-2.5 rounded-2xl bg-[#f5f6f8] px-4">
          <Image src="/mobile/icon-search.svg" alt="" width={20} height={20} />
          <span className="sr-only">Kişi ara</span>
          <input
            type="search"
            value={messages.query}
            onChange={(event) => messages.setQuery(event.target.value)}
            placeholder="Kişi ara"
            className="min-w-0 flex-1 bg-transparent text-[15px] leading-[1.35] text-[#22262b] outline-none placeholder:text-[#858c96] focus-visible:outline-none!"
          />
        </label>

        {messages.isLoading ? (
          <MobileListSkeleton />
        ) : messages.isError ? (
          <MobileErrorState
            title="Mesajlar yüklenemedi."
            onRetry={messages.retry}
          />
        ) : messages.conversations.length === 0 ? (
          <MobileEmptyState
            icon="/mobile/icon-messages.svg"
            title="Henüz mesajın yok"
            description="Mentorluk başladığında konuşmaların burada görünecek."
          />
        ) : messages.shown.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] leading-[1.35] text-[#858c96]">
            “{messages.query}” ile eşleşen konuşma yok.
          </p>
        ) : (
          <ul aria-label="Konuşmalar">
            {messages.shown.map((conversation) => (
              <ConversationRow
                key={`${conversation.kind}-${conversation.id}`}
                conversation={conversation}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
