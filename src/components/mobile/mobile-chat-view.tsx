"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import {
  MobileErrorState,
  MobileListSkeleton,
} from "@/components/mobile/mobile-states";
import {
  MAX_CHAT_MESSAGE_LENGTH,
  useMobileChat,
} from "@/hooks/use-mobile-chat";
import {
  MobileChatItemKind,
  type MobileChatItem,
  type MobileConversationKind,
} from "@/interfaces/mobile";

type ChatMessage = Extract<
  MobileChatItem,
  { kind: MobileChatItemKind.Message }
>;

function Bubble({ message }: { message: ChatMessage }) {
  return (
    <li className={`flex w-full ${message.mine ? "justify-end" : ""}`}>
      <div
        className={`flex max-w-[278px] flex-col gap-1.5 px-3.5 py-[11px] ${
          message.mine
            ? "rounded-t-[22px] rounded-br-[6px] rounded-bl-[22px] bg-[var(--mobile-accent)] text-white"
            : "rounded-t-[22px] rounded-br-[22px] rounded-bl-[6px] bg-[#f5f6f8] text-[#22262b]"
        }`}
      >
        {message.fileName ? (
          <span className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5">
            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#f5f6f8]">
              <Image
                src="/mobile/icon-file.svg"
                alt=""
                width={16}
                height={16}
              />
            </span>
            <span className="flex min-w-0 flex-col gap-px leading-[1.35]">
              <span className="truncate text-[13.5px] font-medium text-[#22262b]">
                {message.fileName}
              </span>
              <span className="text-[11.5px] text-[#858c96]">
                Paylaşılan dosya
              </span>
            </span>
          </span>
        ) : (
          <p className="text-[14.5px] leading-[1.45] break-words whitespace-pre-wrap">
            {message.body}
          </p>
        )}
        <span
          className={`flex items-center justify-end gap-1 text-[11px] leading-[1.35] ${
            message.mine ? "text-white" : "text-[#858c96]"
          }`}
        >
          {message.time}
          {message.read ? (
            <Image
              src="/mobile/icon-read.svg"
              alt="Okundu"
              width={14}
              height={14}
            />
          ) : null}
        </span>
      </div>
    </li>
  );
}

export function MobileChatView({
  kind,
  id,
}: {
  kind: MobileConversationKind;
  id: string;
}) {
  const chat = useMobileChat(kind, id);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const lastItemId = chat.items.at(-1)?.id;

  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: "end" });
  }, [lastItemId]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#f0f2f4] bg-white pt-[calc(4px+env(safe-area-inset-top))] pr-4 pb-2.5 pl-3">
        <Link
          href={chat.backHref}
          aria-label="Mesajlara dön"
          className="flex size-11 shrink-0 items-center justify-center rounded-full"
        >
          <Image src="/mobile/icon-back.svg" alt="" width={22} height={22} />
        </Link>
        {chat.header ? (
          <>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eaf6ff] text-sm leading-[1.35] font-semibold text-[#1583d6]">
              {chat.header.initials}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-px leading-[1.35]">
              <h1 className="truncate text-base font-semibold text-[#22262b]">
                {chat.header.name}
              </h1>
              <p className="truncate text-[12.5px] text-[#1583d6]">
                {chat.header.subtitle}
              </p>
            </div>
          </>
        ) : null}
      </header>

      {chat.strip ? (
        <div className="flex items-center gap-2.5 bg-[#f5f6f8] px-4 py-2.5 text-[13px] leading-[1.35]">
          <Image
            src="/mobile/icon-calendar-sm.svg"
            alt=""
            width={16}
            height={16}
          />
          <p className="min-w-0 flex-1 font-medium text-[#22262b]">
            {chat.strip.label}
          </p>
          <Link href={chat.strip.href} className="font-semibold text-[#676e78]">
            Detay
          </Link>
        </div>
      ) : null}

      <div className="flex-1 p-4">
        {chat.isLoading ? (
          <MobileListSkeleton />
        ) : chat.isError ? (
          <MobileErrorState
            title="Mesajlar yüklenemedi."
            onRetry={chat.retry}
          />
        ) : chat.notFound ? (
          <MobileErrorState
            title="Konuşma bulunamadı."
            description="Bu konuşma artık erişilebilir değil."
          />
        ) : chat.items.length === 0 ? (
          <p className="py-10 text-center text-[13.5px] leading-[1.35] text-[#858c96]">
            İlk mesajı sen yaz.
          </p>
        ) : (
          <ol aria-label="Mesajlar" className="flex flex-col gap-2.5">
            {chat.items.map((item) =>
              item.kind === MobileChatItemKind.Day ? (
                <li key={item.id} className="flex justify-center">
                  <span className="rounded-full bg-[#f5f6f8] px-2.5 py-[5px] text-xs leading-[1.35] font-medium text-[#676e78]">
                    {item.label}
                  </span>
                </li>
              ) : (
                <Bubble key={item.id} message={item} />
              ),
            )}
          </ol>
        )}
        <div ref={bottom} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          chat.submit();
        }}
        className="sticky bottom-0 flex flex-col gap-1.5 border-t border-[#f0f2f4] bg-white px-4 pt-2.5 pb-[calc(12px+env(safe-area-inset-bottom))]"
      >
        {chat.sendError ? (
          <p
            role="alert"
            className="text-[12.5px] leading-[1.35] text-[#d9464b]"
          >
            Mesaj gönderilemedi. Tekrar dene.
          </p>
        ) : null}
        {chat.canSend ? (
          <div className="flex items-center gap-2.5">
            {chat.canAttach ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={chat.isUploading}
                  aria-label={
                    chat.isUploading ? "Dosya yükleniyor" : "Dosya ekle"
                  }
                  className="flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
                >
                  <Image
                    src="/mobile/icon-attach.svg"
                    alt=""
                    width={22}
                    height={22}
                  />
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) chat.attach(file);
                    event.target.value = "";
                  }}
                />
              </>
            ) : null}
            <label className="flex h-[46px] min-w-0 flex-1 items-center rounded-full bg-[#f5f6f8] px-4">
              <span className="sr-only">Mesaj</span>
              <input
                value={chat.draft}
                onChange={(event) => chat.setDraft(event.target.value)}
                maxLength={MAX_CHAT_MESSAGE_LENGTH}
                placeholder="Mesaj yaz…"
                className="min-w-0 flex-1 bg-transparent text-[15px] leading-[1.35] text-[#22262b] outline-none placeholder:text-[#858c96] focus-visible:outline-none!"
              />
            </label>
            <button
              type="submit"
              disabled={!chat.draft.trim() || chat.isSending}
              aria-label="Gönder"
              className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--mobile-accent)] disabled:opacity-50"
            >
              <Image
                src="/mobile/icon-send.svg"
                alt=""
                width={20}
                height={20}
              />
            </button>
          </div>
        ) : (
          <p className="py-2 text-center text-[13px] leading-[1.35] text-[#858c96]">
            Bu konuşma kapandı; yeni mesaj gönderilemez.
          </p>
        )}
      </form>
    </div>
  );
}
