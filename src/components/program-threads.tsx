"use client";

import type { ProgramThreads } from "@/hooks/use-program-threads";
import {
  conversationTime,
  MAX_MESSAGE_LENGTH,
  messageTime,
} from "@/lib/coordinator-messages";
import { initials } from "@/lib/utils";

type Accent = { strong: string; soft: string };

/** The "Program" section under a Mesajlar list: one row per coordinator thread. */
export function ProgramThreadList({
  threads,
  accent,
  onSelect,
}: {
  threads: ProgramThreads;
  accent: Accent;
  onSelect: (id: string) => void;
}) {
  if (!threads.threads.length) return null;
  return (
    <section aria-label="Program mesajları">
      <h2 className="border-t border-[#eef0f3] px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#858c96]">
        Program
      </h2>
      <ul>
        {threads.threads.map((thread) => {
          const selected = thread.id === threads.openId;
          const unread = thread.unreadCount ?? (thread.unread ? 1 : 0);
          return (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => onSelect(thread.id)}
                style={selected ? { backgroundColor: accent.soft } : undefined}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${selected ? "" : "hover:bg-[#fafbfc]"}`}
              >
                <span
                  className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#f3f4f6] text-[10px] font-semibold"
                  style={{ color: accent.strong }}
                >
                  {initials(thread.programName) || "PR"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <b className="truncate text-[13px] font-semibold">
                      {thread.programName}
                    </b>
                    <span className="shrink-0 text-[10px] text-[#858c96]">
                      {conversationTime(thread.lastMessageAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-[#676e78]">
                    Koordinatör · {thread.coordinatorName}
                  </span>
                  <span className="mt-1 block truncate text-[10.5px] text-[#858c96]">
                    {thread.lastMessagePreview ?? "Henüz mesaj yok"}
                  </span>
                </span>
                {unread ? (
                  <span
                    className="grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: accent.strong }}
                    aria-label={`${unread} okunmamış mesaj`}
                  >
                    {unread}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The open coordinator thread: header, messages and a text-only composer. */
export function ProgramThreadPane({
  threads,
  accent,
  className = "",
}: {
  threads: ProgramThreads;
  accent: Accent;
  className?: string;
}) {
  const thread = threads.active;
  if (!thread) return null;
  return (
    <section className={`flex min-h-0 flex-col bg-white ${className}`}>
      <header className="border-b border-[#e4e7ea] px-6 py-4">
        <h2 className="text-[15px] font-semibold">{thread.programName}</h2>
        <p className="mt-0.5 text-[12px] text-[#676e78]">
          Koordinatör · {thread.coordinatorName}
        </p>
      </header>
      <div className="min-h-[240px] flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {threads.messagesLoading ? (
          <p className="text-[12px] text-[#858c96]">Yükleniyor…</p>
        ) : threads.messages.length ? (
          threads.messages.map((message) => (
            <article
              key={message.id}
              className={`flex flex-col ${message.mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[520px] rounded-xl px-3.5 py-3 text-[13px] leading-5 ${message.mine ? "text-white" : "border border-[#e4e7ea] bg-[#f6f7f9]"}`}
                style={
                  message.mine ? { backgroundColor: accent.strong } : undefined
                }
              >
                {message.mine ? null : (
                  <p className="mb-1 text-[10.5px] font-medium text-[#858c96]">
                    {message.senderName}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{message.body}</p>
              </div>
              <time className="mt-1 text-[10px] text-[#858c96]">
                {messageTime(message.createdAt)}
              </time>
            </article>
          ))
        ) : (
          <p className="text-[12px] text-[#858c96]">
            Koordinatörle henüz mesaj yok.
          </p>
        )}
      </div>
      {threads.sendError ? (
        <p className="px-6 text-[12px] text-red-700">
          Mesaj gönderilemedi. Tekrar deneyin.
        </p>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          threads.send();
        }}
        className="flex items-center gap-3 border-t border-[#e4e7ea] px-6 py-4"
      >
        <input
          value={threads.draft}
          onChange={(event) => threads.setDraft(event.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Koordinatöre yaz…"
          aria-label="Koordinatöre mesaj"
          className="h-9 min-w-0 flex-1 rounded-full bg-[#f6f7f9] px-4 text-[13px] outline-none placeholder:text-[#858c96]"
        />
        <button
          type="submit"
          disabled={!threads.canSend}
          style={{ backgroundColor: accent.strong }}
          className="h-9 rounded-full px-[18px] text-[13px] font-semibold text-white disabled:opacity-50"
        >
          Gönder
        </button>
      </form>
    </section>
  );
}
