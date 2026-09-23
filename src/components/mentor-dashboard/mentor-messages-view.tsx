"use client";

import { ChevronRight, Mail, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { useMentorMessages } from "@/hooks/use-mentor-messages";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

function participantOf(request: MentorshipRequest) {
  return request.requesterName ?? request.organizationName ?? "Mentee";
}

function contextOf(request: MentorshipRequest) {
  return [request.organizationName, request.supportArea]
    .filter(Boolean)
    .join(" · ");
}

function lastMessageOf(request: MentorshipRequest) {
  return request.messages.length
    ? request.messages[request.messages.length - 1]
    : null;
}

function clockLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
}: {
  conversations: MentorshipRequest[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const shown = useMemo(
    () =>
      conversations.filter((request) =>
        [participantOf(request), contextOf(request), request.summary ?? ""]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(search.toLocaleLowerCase("tr-TR")),
      ),
    [conversations, search],
  );
  return (
    <aside className="overflow-hidden rounded-[12px] border border-[#e4e7ea] bg-white">
      <div className="h-[100px] px-4 pt-4">
        <h2 className="text-[15px] font-semibold">Konuşmalar</h2>
        <label className="mt-3 flex h-[37px] items-center gap-2 rounded-lg border border-[#e4e7ea] bg-[#f6f7f9] px-3">
          <Search className="size-[15px] text-[#676e78]" strokeWidth={1.6} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#858c96]"
            placeholder="Mentee veya startup ara"
          />
        </label>
      </div>
      {isLoading ? (
        <p className="border-t border-[#eef0f3] p-4 text-xs text-[#858c96]">
          Yükleniyor...
        </p>
      ) : shown.length === 0 ? (
        <p className="border-t border-[#eef0f3] p-4 text-xs text-[#858c96]">
          {conversations.length === 0
            ? "Açık bir mentorluk talebi olunca konuşmalar burada görünür."
            : "Aramanla eşleşen konuşma yok."}
        </p>
      ) : (
        <ul>
          {shown.map((request) => {
            const last = lastMessageOf(request);
            return (
              <li key={request.id} className="border-t border-[#eef0f3]">
                <button
                  onClick={() => onSelect(request.id)}
                  className={`flex h-[85px] w-full gap-3 px-4 py-3 text-left ${activeId === request.id ? "bg-[#f2f8fc]" : "hover:bg-[#fafbfc]"}`}
                >
                  <span
                    className={`grid size-[34px] shrink-0 place-items-center rounded-full text-[10px] font-medium ${activeId === request.id ? "bg-[#e7f5ff] text-[#26a4ff]" : "bg-[#f3f4f6] text-[#676e78]"}`}
                  >
                    {initials(participantOf(request)) || "MN"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between">
                      <b className="text-[13px] font-semibold">
                        {participantOf(request)}
                      </b>
                      {last ? (
                        <span className="text-[10px] text-[#858c96]">
                          {clockLabel(last.createdAt)}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] text-[#676e78]">
                      {contextOf(request)}
                    </span>
                    <span className="mt-1 block truncate text-[10.5px] text-[#858c96]">
                      {last?.body ?? "Henüz mesaj yok"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

function EmptyConversation() {
  return (
    <section className="grid min-h-[341px] place-items-center rounded-[12px] border border-[#e4e7ea] bg-white text-center">
      <div>
        <Mail className="mx-auto size-9" strokeWidth={1.3} />
        <h2 className="mt-3 text-base font-semibold">Bir konuşma seç</h2>
        <p className="mx-auto mt-3 max-w-[360px] text-[12px] leading-5 text-[#676e78]">
          Soldaki listeden bir mentee seçtiğinde ilgili mentorluk bağlamı da
          burada görünür.
        </p>
      </div>
    </section>
  );
}

function ActiveConversation({
  request,
  meetingLabel,
  viewerUserId,
  messageForm,
  onShareFile,
  isSharing,
}: {
  request: MentorshipRequest;
  meetingLabel: string | null;
  viewerUserId: string;
  messageForm: ReturnType<typeof useMentorMessages>["messageForm"];
  onShareFile: (file: File) => void;
  isSharing: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <section className="overflow-hidden rounded-[12px] border border-[#e4e7ea] bg-white">
      <header className="flex h-[75px] items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-[38px] place-items-center rounded-full bg-[#e7f5ff] text-[10px] font-medium text-[#26a4ff]">
            {initials(participantOf(request)) || "MN"}
          </span>
          <div>
            <h2 className="text-[15px] font-semibold">
              {participantOf(request)}
            </h2>
            <p className="mt-0.5 text-[11px] text-[#676e78]">
              {contextOf(request)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={isSharing}
            className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px] disabled:opacity-50"
          >
            Dosya paylaş
          </button>
          <Link
            href="/mentor-dashboard/calendar"
            className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px]"
          >
            Toplantı planla
          </Link>
          <ChevronRight className="size-[18px]" strokeWidth={1.5} />
        </div>
      </header>
      <div className="border-t border-[#eef0f3] px-5 pb-[18px] pt-[18px]">
        <div className="flex h-[62px] items-center justify-between rounded-lg bg-[#f2f8fc] px-4">
          <div>
            <p className="text-[10px] font-semibold uppercase text-[#26a4ff]">
              İlgili mentorluk · {request.organizationName ?? "Mentorluk"}
            </p>
            <p className="mt-1 text-[12px] text-[#4a5059]">
              {meetingLabel ?? "Planlanmış görüşme yok"}
            </p>
          </div>
          <Link
            href={`/mentor-dashboard/mentorship/${encodeURIComponent(request.id)}`}
            className="text-[12px] font-medium text-[#26a4ff]"
          >
            Mentorluk detayına git →
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {request.messages.length === 0 ? (
            <p className="text-[12px] text-[#858c96]">
              Bu mentorlukta henüz mesaj yok.
            </p>
          ) : (
            request.messages.map((message) => {
              const own = message.authorId === viewerUserId;
              return (
                <article
                  key={message.id}
                  className={`flex flex-col ${own ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`w-full max-w-[468px] rounded-xl px-3.5 py-3 text-[12px] leading-5 ${own ? "bg-[#f2f8fc]" : "border border-[#e4e7ea] bg-[#f6f7f9]"}`}
                  >
                    <p
                      className={`mb-1 text-[10.5px] font-medium ${own ? "text-[#26a4ff]" : "text-[#858c96]"}`}
                    >
                      {message.authorName}
                    </p>
                    <p>{message.body}</p>
                  </div>
                  <time className="mt-1 text-[9.5px] text-[#858c96]">
                    {clockLabel(message.createdAt)}
                  </time>
                </article>
              );
            })
          )}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void messageForm.sendMessage();
          }}
          className="mt-3 flex h-[63px] items-center rounded-lg border border-[#e4e7ea] px-3.5"
        >
          <input
            value={messageForm.message}
            onChange={(event) => messageForm.setMessage(event.target.value)}
            className="min-w-0 flex-1 text-[12px] outline-none placeholder:text-[#858c96]"
            placeholder="Mesaj yaz…"
          />
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            aria-label="Dosya seç"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onShareFile(file);
              event.target.value = "";
            }}
          />
          <Upload className="mr-3 size-[18px]" strokeWidth={1.5} />
          <button
            type="submit"
            disabled={messageForm.isSending || !messageForm.message.trim()}
            className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] text-white disabled:bg-[#c9cdd2]"
          >
            Gönder
          </button>
        </form>
      </div>
    </section>
  );
}

export function MentorMessagesView() {
  const params = useSearchParams();
  const preferredRequestId = params.get("request") ?? params.get("id");
  const messages = useMentorMessages(preferredRequestId);
  const meetingLabel = messages.meetingLabel;

  return (
    <AppShell active={AppArea.Meetings} mentorHome>
      <main className="mx-auto w-full max-w-[1276px] px-6 pb-[72px] pt-3">
        <header>
          <h1 className="text-[28px] font-semibold leading-[42px]">Mesajlar</h1>
          <p className="mt-1 text-[13px] text-[#676e78]">
            Mentee ve koordinatörlerle konuşurken mentorluk bağlamını kaybetme.
          </p>
        </header>
        {messages.error ? (
          <p className="mt-5 rounded-lg border border-[#f2b78f] bg-[#fff9f5] p-4 text-xs text-[#a65a15]">
            {messages.error.message}
          </p>
        ) : null}
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[340px_minmax(0,868px)]">
          <ConversationList
            conversations={messages.conversations}
            activeId={messages.activeId}
            isLoading={messages.isLoading}
            onSelect={messages.select}
          />
          {messages.active ? (
            <ActiveConversation
              request={messages.active}
              meetingLabel={meetingLabel}
              viewerUserId={messages.viewerUserId}
              messageForm={messages.messageForm}
              isSharing={messages.fileUpload.isPending}
              onShareFile={(file) => {
                void messages.fileUpload.mutateAsync(file);
              }}
            />
          ) : (
            <EmptyConversation />
          )}
        </div>
      </main>
    </AppShell>
  );
}
