"use client";

import { FileSpreadsheet, Paperclip, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import {
  ProgramThreadList,
  ProgramThreadPane,
} from "@/components/program-threads";
import { useMenteeMessages } from "@/hooks/use-mentee-messages";
import type { ProgramThreads } from "@/hooks/use-program-threads";
import type {
  MentorshipRequest,
  RequestMessage,
} from "@/interfaces/mentorship-request";
import { withoutSlotLines } from "@/lib/mentor-availability-days";
import { sharedFileName } from "@/lib/mentorship-messages";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

const ACCENT = { strong: "#e86f22", soft: "#fdebdd" };

function lastMessage(request: MentorshipRequest) {
  return request.messages.at(-1) ?? null;
}

function timeLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Dün";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  programThreads,
}: {
  conversations: MentorshipRequest[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  programThreads: ProgramThreads;
}) {
  const [search, setSearch] = useState("");
  const shown = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    if (!query) return conversations;
    return conversations.filter((request) =>
      [request.mentorName, request.supportArea, lastMessage(request)?.body]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query),
    );
  }, [conversations, search]);

  return (
    <aside className="h-full border-r border-[#e4e7ea] bg-white">
      <div className="px-6 pb-3 pt-6">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-[#e4e7ea] bg-[#f7f7f7] px-3.5">
          <Search className="size-4 text-[#666b75]" strokeWidth={1.6} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mentor veya konu ara…"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#666b75]"
          />
        </label>
      </div>
      {isLoading ? (
        <p className="px-6 py-5 text-xs text-[#666b75]">Yükleniyor…</p>
      ) : shown.length ? (
        <ul>
          {shown.map((request) => {
            const last = lastMessage(request);
            const selected = request.id === activeId;
            return (
              <li key={request.id}>
                <button
                  type="button"
                  onClick={() => onSelect(request.id)}
                  className={`flex h-[79px] w-full items-center gap-3 px-6 py-3.5 text-left ${selected ? "bg-[#fdebdd]" : "hover:bg-[#fafafa]"}`}
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-[#e86f22] ${selected ? "bg-[#ffdebf]" : "bg-[#f2f2f2]"}`}
                  >
                    {initials(request.mentorName) || "MN"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <strong className="truncate text-sm font-semibold text-[#1a1a1a]">
                        {request.mentorName}
                      </strong>
                      {last ? (
                        <time className="shrink-0 text-[11px] text-[#666b75]">
                          {timeLabel(last.createdAt)}
                        </time>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-[#666b75]">
                      {request.supportArea}
                    </span>
                    <span
                      className={`block truncate text-xs ${selected ? "text-[#1a1a1a]" : "text-[#666b75]"}`}
                    >
                      {last ? withoutSlotLines(last.body) : "Henüz mesaj yok"}
                    </span>
                  </span>
                  {selected && last ? (
                    <span className="size-2 shrink-0 rounded-full bg-[#e86f22]" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-6 py-5 text-xs leading-5 text-[#666b75]">
          {conversations.length
            ? "Aramanla eşleşen konuşma yok."
            : "Mesajlaşma, bir mentorluk kabul edildiğinde açılır."}
        </p>
      )}
      <ProgramThreadList
        threads={programThreads}
        accent={ACCENT}
        onSelect={programThreads.open}
      />
    </aside>
  );
}

function MessageBubble({
  message,
  own,
}: {
  message: RequestMessage;
  own: boolean;
}) {
  const fileName = sharedFileName(message.body);
  if (fileName) {
    return (
      <article className="flex flex-col items-end">
        <div className="flex items-center gap-2.5 rounded-[10px] border border-[#e4e7ea] bg-white px-3.5 py-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-[#d9eddb] text-[#3d8750]">
            <FileSpreadsheet className="size-[18px]" />
          </span>
          <span>
            <strong className="block max-w-[300px] truncate text-[13px] font-medium">
              {fileName}
            </strong>
            <small className="text-[11px] text-[#666b75]">
              Paylaşılan dosya · {timeLabel(message.createdAt)}
            </small>
          </span>
        </div>
      </article>
    );
  }
  return (
    <article className={`flex flex-col ${own ? "items-end" : "items-start"}`}>
      <p
        className={`max-w-[520px] rounded-xl px-4 py-3 text-[13.5px] leading-[normal] ${own ? "bg-[#e86f22] text-white" : "bg-[#f7f7f7] text-[#1a1a1a]"}`}
      >
        {withoutSlotLines(message.body)}
      </p>
      <time className="mt-1 text-[11px] text-[#666b75]">
        {timeLabel(message.createdAt)}
      </time>
    </article>
  );
}

function Conversation({
  messages,
}: {
  messages: ReturnType<typeof useMenteeMessages>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const active = messages.active;
  if (messages.programThreads.active)
    return (
      <ProgramThreadPane
        threads={messages.programThreads}
        accent={ACCENT}
        className="h-full"
      />
    );
  if (!active)
    return (
      <section className="grid h-full place-items-center text-sm text-[#666b75]">
        Bir konuşma seçin.
      </section>
    );
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="border-b border-[#e4e7ea] px-8 py-[17px]">
        <h1 className="text-base font-semibold text-[#1a1a1a]">
          {active.mentorName}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[13px] text-[#666b75]">
            {active.supportArea} Mentoru
          </span>
          <span className="rounded-full bg-[#fdebdd] px-2.5 py-1 text-[11px] font-medium text-[#e86f22]">
            Aktif Mentorluk
          </span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-8 py-6">
          {active.messages.length ? (
            active.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                own={message.authorId === messages.viewerUserId}
              />
            ))
          ) : (
            <p className="text-xs text-[#666b75]">
              Bu mentorlukta henüz mesaj yok.
            </p>
          )}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void messages.messageForm.sendReply();
          }}
          className="flex items-center gap-3 border-t border-[#e4e7ea] px-8 py-6"
        >
          <div className="flex h-9 min-w-0 flex-1 items-center rounded-full bg-[#f7f7f7] px-4">
            <input
              value={messages.messageForm.reply}
              onChange={(event) =>
                messages.messageForm.setReply(event.target.value)
              }
              placeholder="Mesaj yaz…"
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#666b75]"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={messages.fileUpload.isPending}
              aria-label="Dosya paylaş"
              className="text-[#666b75] disabled:opacity-50"
            >
              <Paperclip className="size-[17px]" />
            </button>
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void messages.fileUpload.mutateAsync(file);
                event.target.value = "";
              }}
            />
          </div>
          <button
            type="submit"
            disabled={
              !messages.messageForm.reply.trim() ||
              messages.messageForm.isSending
            }
            className="h-9 rounded-full bg-[#e86f22] px-[18px] text-[13px] font-semibold text-white disabled:opacity-50"
          >
            Gönder
          </button>
        </form>
      </div>
    </section>
  );
}

export function MenteeMessagesView() {
  const messages = useMenteeMessages();
  return (
    <AppShell active={AppArea.Meetings} menteeHome>
      {messages.error ? (
        <p className="mx-auto mt-3 max-w-[1392px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {messages.error.message}
        </p>
      ) : null}
      <main className="mx-auto grid h-[calc(100vh-106px)] min-h-[620px] w-full max-w-[1440px] grid-cols-[360px_minmax(0,1fr)] overflow-hidden border-x border-[#e4e7ea] max-md:grid-cols-1">
        <ConversationList
          conversations={messages.conversations}
          activeId={messages.programThreads.active ? null : messages.activeId}
          isLoading={messages.isLoading}
          onSelect={messages.select}
          programThreads={messages.programThreads}
        />
        <Conversation messages={messages} />
      </main>
    </AppShell>
  );
}
