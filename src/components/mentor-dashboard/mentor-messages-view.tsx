"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { useMentorMessages } from "@/hooks/use-mentor-messages";
import type {
  MentorshipRequest,
  RequestMessage,
} from "@/interfaces/mentorship-request";
import { formatMeetingShort } from "@/lib/format";
import {
  mentorRequestHref,
  mentorWorkspaceName,
  mentorWorkspacePerson,
} from "@/lib/mentorship-workspace";
import { AppArea } from "@/types/app-area";

const FILE_MESSAGE_PREFIX = "Dosya paylaşıldı:";

function conversationName(request: MentorshipRequest) {
  const organization = mentorWorkspaceName(request);
  const person = mentorWorkspacePerson(request);
  return person ? `${person} · ${organization}` : organization;
}

function latestPreview(request: MentorshipRequest) {
  return (
    request.messages.at(-1)?.body || request.summary || request.supportArea
  );
}

function sharedFilename(message: RequestMessage) {
  if (!message.body.startsWith(FILE_MESSAGE_PREFIX)) return null;
  return message.body.slice(FILE_MESSAGE_PREFIX.length).trim() || null;
}

function MessageBubbles({
  messages,
  viewerUserId,
}: {
  messages: RequestMessage[];
  viewerUserId: string;
}) {
  const chatMessages = messages.filter((message) => !sharedFilename(message));
  if (chatMessages.length === 0) {
    return (
      <p className="grid min-h-32 place-items-center text-[13px] text-[#676e78]">
        Henüz mesaj yok. İlk mesajı sen gönderebilirsin.
      </p>
    );
  }
  return (
    <ul className="space-y-[30px]" aria-label="Mesaj geçmişi">
      {chatMessages.map((message) => {
        const own = message.authorId === viewerUserId;
        return (
          <li
            key={message.id}
            className={`flex ${own ? "justify-start" : "justify-end"}`}
          >
            <article
              className={`rounded-xl px-3.5 py-2.5 text-[13px] text-[#22262b] ${
                own
                  ? "w-full max-w-[550px] bg-[#f6f7f9]"
                  : "w-full max-w-[498px] bg-[#fff7f2]"
              }`}
            >
              <p className="mb-2 text-[11px] font-medium text-[#676e78]">
                {message.authorName}
              </p>
              <p className="leading-[1.45]">{message.body}</p>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

export function MentorMessagesView() {
  const {
    active,
    activeId,
    activeMeeting,
    conversations,
    error,
    fileUpload,
    isLoading,
    messageForm,
    select,
    viewerUserId,
  } = useMentorMessages();
  const [search, setSearch] = useState("");
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      [
        conversationName(conversation),
        conversation.supportArea,
        latestPreview(conversation),
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query),
    );
  }, [conversations, search]);
  const sharedMessages =
    active?.messages.filter((message) => sharedFilename(message)) ?? [];
  const latestSharedMessage = sharedMessages.at(-1);
  const latestSharedFilename = latestSharedMessage
    ? sharedFilename(latestSharedMessage)
    : null;

  function sendMessage() {
    void messageForm.sendMessage().catch(() => undefined);
  }

  return (
    <AppShell active={AppArea.Meetings} mentorHome>
      <div className="px-4 pb-16 sm:px-8">
        <div className="mx-auto w-full max-w-[1200px] pt-10">
          <header>
            <h1 className="text-[28px] font-semibold leading-[34px] text-[#22262b]">
              Mesajlar
            </h1>
            <p className="mt-2 text-sm leading-[17px] text-[#676e78]">
              Mentee ve koordinatörlerle konuşurken ilgili mentorluk bağlamını
              kaybetme.
            </p>
          </header>

          <section
            aria-label="Mesajlaşma alanı"
            className="mt-[42px] overflow-hidden rounded-[10px] border border-[#e4e7ea] bg-white lg:grid lg:h-[730px] lg:grid-cols-[350px_minmax(0,1fr)]"
          >
            <aside className="border-b border-[#e4e7ea] bg-white p-5 lg:border-b-0 lg:border-r">
              <h2 className="text-lg font-semibold leading-[22px] text-[#22262b]">
                Konuşmalar
              </h2>
              <input
                type="search"
                aria-label="Konuşmalarda ara"
                placeholder="Ara…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-4 h-10 w-full rounded-lg border-0 bg-[#f6f7f9] px-3.5 text-[13px] text-[#22262b] placeholder:text-[#676e78]"
              />

              {isLoading ? (
                <p className="py-10 text-center text-[13px] text-[#676e78]">
                  Mesajlar yükleniyor...
                </p>
              ) : error ? (
                <p role="alert" className="py-10 text-[13px] text-red-700">
                  {error.message}
                </p>
              ) : conversations.length === 0 ? (
                <p className="py-10 text-[13px] leading-5 text-[#676e78]">
                  Bir mentorluk talebini kabul ettiğinde konuşma burada açılır.
                </p>
              ) : filteredConversations.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-[#676e78]">
                  Aramana uygun konuşma bulunamadı.
                </p>
              ) : (
                <ul className="mt-[22px] space-y-2.5">
                  {filteredConversations.map((conversation) => {
                    const selected = conversation.id === activeId;
                    return (
                      <li key={conversation.id}>
                        <button
                          type="button"
                          aria-current={selected ? "true" : undefined}
                          onClick={() => select(conversation.id)}
                          className={`h-[92px] w-full rounded-[10px] px-3.5 py-3 text-left transition ${
                            selected
                              ? "bg-[#fff7f2]"
                              : "bg-white hover:bg-[#fafafa]"
                          }`}
                        >
                          <span className="block truncate text-sm font-semibold text-[#22262b]">
                            {conversationName(conversation)}
                          </span>
                          <span className="mt-1.5 block truncate text-xs text-[#676e78]">
                            {conversation.supportArea}
                          </span>
                          <span className="mt-2 block truncate text-xs text-[#22262b]">
                            {latestPreview(conversation)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            <div className="flex min-h-[620px] min-w-0 flex-col bg-white px-[22px] py-5 lg:min-h-0">
              {active ? (
                <>
                  <div>
                    <h2 className="text-[17px] font-semibold text-[#22262b]">
                      {conversationName(active)}
                    </h2>
                    <p className="mt-1 text-xs text-[#676e78]">
                      {active.supportArea} · Aktif mentorluk
                    </p>
                  </div>

                  <div className="mt-[22px] rounded-[10px] bg-[#f2f7fc] px-3.5 py-3">
                    <p className="text-[10px] font-semibold uppercase text-[#3870b8]">
                      İlgili mentorluk
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#22262b]">
                          {mentorWorkspaceName(active)} ·{" "}
                          {active.summary || active.supportArea}
                        </p>
                        <p className="mt-1 text-xs text-[#676e78]">
                          {activeMeeting
                            ? `Sonraki görüşme ${formatMeetingShort(activeMeeting.scheduledAt)}`
                            : "Görüşme henüz planlanmadı"}
                        </p>
                      </div>
                      <Link
                        href={mentorRequestHref(active.id)}
                        className="shrink-0 text-xs font-medium text-[#3870b8] hover:underline"
                      >
                        Mentorluk detayına git →
                      </Link>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto py-7">
                    <MessageBubbles
                      messages={active.messages}
                      viewerUserId={viewerUserId}
                    />
                  </div>

                  {latestSharedMessage && latestSharedFilename ? (
                    <div className="mb-2 rounded-lg border border-[#e4e7ea] px-3.5 py-2.5">
                      <p className="truncate text-[13px] font-semibold text-[#22262b]">
                        {latestSharedFilename}
                      </p>
                      <p className="mt-1 text-[11px] text-[#676e78]">
                        {latestSharedMessage.authorName} tarafından paylaşıldı
                      </p>
                    </div>
                  ) : null}

                  <form
                    className="flex min-h-14 items-center gap-2 rounded-[10px] border border-[#e4e7ea] bg-white p-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      sendMessage();
                    }}
                  >
                    <label className="sr-only" htmlFor="mentor-message">
                      Mesaj yaz
                    </label>
                    <textarea
                      id="mentor-message"
                      rows={1}
                      value={messageForm.message}
                      onChange={(event) =>
                        messageForm.setMessage(event.target.value)
                      }
                      placeholder="Mesaj yaz…"
                      className="min-h-9 min-w-0 flex-1 resize-none border-0 px-1.5 py-2 text-[13px] text-[#22262b] outline-none placeholder:text-[#676e78]"
                    />
                    <label className="shrink-0 cursor-pointer px-2 text-xs font-medium text-[#676e78] hover:text-[#e86f22]">
                      {fileUpload.isPending ? "Paylaşılıyor…" : "Dosya paylaş"}
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        className="sr-only"
                        disabled={fileUpload.isPending}
                        aria-label="Mentorluk dosyası paylaş"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file)
                            void fileUpload
                              .mutateAsync(file)
                              .catch(() => undefined);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={
                        !messageForm.message.trim() || messageForm.isSending
                      }
                      className="h-[38px] w-[88px] shrink-0 rounded-lg bg-[#e86f22] text-[13px] font-medium text-white hover:bg-[#ce5e19] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {messageForm.isSending ? "Gönderiliyor…" : "Gönder"}
                    </button>
                  </form>
                  {messageForm.error || fileUpload.error ? (
                    <p role="alert" className="mt-2 text-xs text-red-700">
                      {messageForm.error?.message ?? fileUpload.error?.message}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="grid flex-1 place-items-center text-center">
                  <div>
                    <h2 className="text-base font-semibold text-[#22262b]">
                      Henüz mesajlaşma yok
                    </h2>
                    <p className="mt-2 max-w-sm text-sm text-[#676e78]">
                      Kabul edilmiş bir mentorluk olduğunda konuşma burada
                      açılır.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
