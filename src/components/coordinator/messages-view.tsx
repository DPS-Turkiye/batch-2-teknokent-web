"use client";

import { ArrowRight, SendHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  AnnouncementPane,
  AnnouncementThreadList,
} from "@/components/announcements";
import {
  Avatar,
  EmptyNote,
  FilterPills,
  PageHeading,
  QueryNotice,
  SearchField,
  SolidButton,
  StatusChip,
} from "@/components/admin/admin-ui";
import { PillSelect } from "@/components/coordinator/pill-select";
import {
  type MessagesDeepLink,
  useConversationTargets,
  useCoordinatorMessages,
} from "@/hooks/use-coordinator-messages";
import {
  type CoordinatorConversation,
  CoordinatorConversationCounterpart,
  type CoordinatorMessage,
  type StartCoordinatorConversationInput,
} from "@/interfaces/coordinator-conversation";
import type { CoordinatorMentorship } from "@/interfaces/coordinator-mentorship";
import type { CoordinatorProgram } from "@/interfaces/coordinator-program";
import { mentorshipHref } from "@/lib/coordinator-calendar";
import {
  HEALTH_LABELS,
  HEALTH_TONES,
  nextMeetingLabel,
} from "@/lib/coordinator-mentorships";
import {
  conversationTime,
  COUNTERPART_LABELS,
  isUnread,
  MAX_MESSAGE_LENGTH,
  messageDayLabel,
  MessageFilter,
  messageTime,
} from "@/lib/coordinator-messages";
import { initials } from "@/lib/utils";

const ANNOUNCEMENT_ACCENT = { strong: "#22262b", soft: "#f4f5f7" };

function counterpartTone(
  conversation: Pick<CoordinatorConversation, "counterpartType">,
) {
  return conversation.counterpartType ===
    CoordinatorConversationCounterpart.Mentor
    ? "blue"
    : "orange";
}

export function CoordinatorMessagesView({ link }: { link: MessagesDeepLink }) {
  const messages = useCoordinatorMessages(link);
  const programName =
    messages.programOptions.find((program) => program.id === messages.programId)
      ?.name ?? "Tüm programlar";

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={programName}
        title="Mesajlar"
        subtitle={messages.subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PillSelect
              label="Program:"
              value={messages.programId ?? ""}
              onChange={(value) => messages.setProgramId(value || null)}
              options={[
                { value: "", label: "Tüm programlar" },
                ...messages.programOptions.map((program) => ({
                  value: program.id,
                  label: program.name,
                })),
              ]}
            />
            <SolidButton onClick={messages.openComposer}>
              + Yeni mesaj
            </SolidButton>
          </div>
        }
      />
      <QueryNotice
        isLoading={messages.conversations.isLoading}
        error={messages.conversations.error ?? messages.startError}
      />

      <div className="grid overflow-hidden rounded-[28px] border border-[#e9ecef] bg-white lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_280px]">
        <aside className="border-b border-[#eef0f2] p-4 lg:border-b-0 lg:border-r">
          <SearchField
            value={messages.search}
            onChange={messages.setSearch}
            placeholder="Kişi, takım veya mesaj ara"
          />
          <div className="mt-3">
            <FilterPills
              value={messages.filter}
              onChange={messages.setFilter}
              options={messages.filterOptions}
            />
          </div>
          {messages.filter === MessageFilter.Announcements ? (
            <div className="-mx-4 mt-3">
              <AnnouncementThreadList
                threads={messages.announcements.threads}
                activeProgramId={messages.announcements.openProgramId}
                accent={ANNOUNCEMENT_ACCENT}
                onSelect={messages.openAnnouncements}
              />
            </div>
          ) : messages.visible.length === 0 && messages.conversations.data ? (
            <EmptyNote>Henüz bir konuşma yok.</EmptyNote>
          ) : (
            <ul aria-label="Konuşmalar" className="mt-3 space-y-1">
              {messages.visible.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  subtitle={messages.subtitleOf(conversation)}
                  active={conversation.id === messages.openId}
                  unread={isUnread(conversation, messages.openId)}
                  onOpen={() => messages.openConversation(conversation.id)}
                />
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[560px] min-w-0 flex-col">
          {messages.announcements.active ? (
            <AnnouncementPane
              thread={messages.announcements.active}
              accent={ANNOUNCEMENT_ACCENT}
              className="flex-1"
              composer={messages.announcements}
            />
          ) : messages.open ? (
            <>
              <header className="flex items-center gap-3 border-b border-[#eef0f2] px-6 py-4">
                <Avatar
                  initials={initials(messages.open.counterpartName)}
                  tone={counterpartTone(messages.open)}
                  size="lg"
                />
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-[15px] font-medium text-[#22262b]">
                    {messages.open.counterpartName}
                    <StatusChip tone={counterpartTone(messages.open)}>
                      {COUNTERPART_LABELS[messages.open.counterpartType]}
                    </StatusChip>
                  </h2>
                  <p className="truncate text-[12.5px] text-[#858c96]">
                    {messages.subtitleOf(messages.open)} ·{" "}
                    {messages.open.programName}
                  </p>
                </div>
              </header>
              <Thread
                messages={messages.messages.data ?? []}
                isLoading={messages.messages.isLoading}
                error={messages.messages.error}
              />
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  messages.sendMessage();
                }}
                className="border-t border-[#eef0f2] p-4"
              >
                <div className="flex items-end gap-2 rounded-[22px] border border-[#e9ecef] px-4 py-2">
                  <label className="sr-only" htmlFor="coordinator-message">
                    Mesaj
                  </label>
                  <textarea
                    id="coordinator-message"
                    value={messages.draft}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={1}
                    placeholder="Mesaj yazın…"
                    onChange={(event) => messages.setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        messages.sendMessage();
                      }
                    }}
                    className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-[13.5px] text-[#22262b] outline-none placeholder:text-[#aeb4bc]"
                  />
                  <button
                    type="submit"
                    aria-label="Gönder"
                    disabled={!messages.canSend}
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-[#22262b] text-white disabled:bg-[#d7dbe0]"
                  >
                    <SendHorizontal aria-hidden className="size-4" />
                  </button>
                </div>
                {messages.sendError ? (
                  <p role="alert" className="mt-2 text-[12px] text-[#d9464b]">
                    {messages.sendError.message}
                  </p>
                ) : null}
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center text-[13.5px] text-[#858c96]">
              Bir konuşma seçin ya da yeni bir mesaj başlatın.
            </div>
          )}
        </section>

        {messages.open && !messages.announcements.active ? (
          <RelatedPanel
            conversation={messages.open}
            related={messages.related}
          />
        ) : null}
      </div>

      {messages.composing ? (
        <NewMessageDialog
          programs={messages.programOptions}
          initialProgramId={messages.programId}
          starting={messages.starting}
          error={messages.startError}
          onStart={messages.startConversation}
          onClose={messages.closeComposer}
        />
      ) : null}
    </div>
  );
}

function ConversationRow({
  conversation,
  subtitle,
  active,
  unread,
  onOpen,
}: {
  conversation: CoordinatorConversation;
  subtitle: string;
  active: boolean;
  unread: boolean;
  onOpen: () => void;
}) {
  const mentor =
    conversation.counterpartType === CoordinatorConversationCounterpart.Mentor;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left ${
          active ? "bg-[#f4f5f7]" : ""
        }`}
      >
        <Avatar
          initials={initials(conversation.counterpartName)}
          tone={mentor ? "blue" : "orange"}
          size="lg"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-[13.5px] font-medium text-[#22262b]">
              {conversation.counterpartName}
            </span>
            <span className="shrink-0 text-[11.5px] text-[#858c96]">
              {conversationTime(conversation.lastMessageAt)}
            </span>
          </span>
          <span
            className={`block truncate text-[12px] ${mentor ? "text-[#1583d6]" : "text-[#e0522a]"}`}
          >
            {subtitle}
          </span>
          <span className="flex items-center gap-2">
            <span className="block flex-1 truncate text-[12.5px] text-[#676e78]">
              {conversation.lastMessagePreview ?? "Henüz mesaj yok"}
            </span>
            {unread ? (
              <span
                role="status"
                aria-label="okunmadı"
                className={`size-2 shrink-0 rounded-full ${mentor ? "bg-[#26a4ff]" : "bg-[#f97316]"}`}
              />
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

function Thread({
  messages,
  isLoading,
  error,
}: {
  messages: CoordinatorMessage[];
  isLoading: boolean;
  error: Error | null;
}) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
      <QueryNotice isLoading={isLoading} error={error} />
      {!isLoading && !error && messages.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-[#858c96]">
          İlk mesajı siz yazın.
        </p>
      ) : null}
      {messages.map((message, index) => {
        const day = messageDayLabel(message.createdAt);
        const showDay =
          index === 0 || messageDayLabel(messages[index - 1].createdAt) !== day;
        return (
          <div key={message.id}>
            {showDay ? (
              <p className="my-2 text-center">
                <span className="rounded-full bg-[#f4f5f7] px-3 py-1 text-[11.5px] text-[#676e78]">
                  {day}
                </span>
              </p>
            ) : null}
            <div className={`flex ${message.mine ? "justify-end" : ""}`}>
              <div
                className={`max-w-[75%] rounded-[20px] px-4 py-3 text-[13.5px] ${
                  message.mine
                    ? "bg-[#22262b] text-white"
                    : "bg-[#f4f5f7] text-[#22262b]"
                }`}
              >
                {!message.mine ? (
                  <p className="mb-1 text-[11.5px] text-[#858c96]">
                    {message.senderName}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap break-words">
                  {message.body}
                </p>
                <p
                  className={`mt-1.5 text-[11px] ${message.mine ? "text-white/60" : "text-[#aeb4bc]"}`}
                >
                  {messageTime(message.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RelatedPanel({
  conversation,
  related,
}: {
  conversation: CoordinatorConversation;
  related: CoordinatorMentorship[];
}) {
  const mentor =
    conversation.counterpartType === CoordinatorConversationCounterpart.Mentor;
  return (
    <aside
      aria-label="İlgili mentorluklar"
      className="hidden space-y-5 border-l border-[#eef0f2] p-5 xl:block"
    >
      <section>
        <h2 className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.04em] text-[#858c96]">
          İlgili mentorluklar
        </h2>
        {related.length === 0 ? (
          <p className="text-[12.5px] text-[#858c96]">
            Bu programda mentorluk yok.
          </p>
        ) : (
          <ul className="space-y-3">
            {related.map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-[#e9ecef] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13.5px] font-medium text-[#22262b]">
                    ↔ {mentor ? row.organizationName : row.mentorName}
                  </p>
                  <StatusChip tone={HEALTH_TONES[row.health]}>
                    {HEALTH_LABELS[row.health]}
                  </StatusChip>
                </div>
                <p className="mt-1 text-[12px] text-[#858c96]">
                  {row.daysSinceLastMeeting != null &&
                  row.daysSinceLastMeeting >= 7
                    ? `${row.daysSinceLastMeeting} gündür görüşme yok`
                    : `Sıradaki: ${nextMeetingLabel(row)}`}
                </p>
                <Link
                  href={mentorshipHref(row.id)}
                  className="mt-2 inline-flex items-center gap-1 text-[12.5px] text-[#676e78]"
                >
                  Mentorluğu aç <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.04em] text-[#858c96]">
          {COUNTERPART_LABELS[conversation.counterpartType]}
        </h2>
        <dl className="space-y-2 text-[12.5px]">
          <div className="flex justify-between gap-3">
            <dt className="text-[#858c96]">{mentor ? "Yük" : "Mentorlar"}</dt>
            <dd className="text-right text-[#22262b]">
              {related.length} mentorluk
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#858c96]">Program</dt>
            <dd className="text-right text-[#22262b]">
              {conversation.programName}
            </dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

function NewMessageDialog({
  programs,
  initialProgramId,
  starting,
  error,
  onStart,
  onClose,
}: {
  programs: CoordinatorProgram[];
  initialProgramId: string | null;
  starting: boolean;
  error: Error | null;
  onStart: (input: StartCoordinatorConversationInput) => void;
  onClose: () => void;
}) {
  const [programId, setProgramId] = useState(
    initialProgramId ?? programs[0]?.id ?? "",
  );
  const [target, setTarget] = useState("");
  const { detail, targets } = useConversationTargets(programId || null);
  const chosen = targets.find(
    (option) => `${option.type}:${option.id}` === target,
  );
  const field =
    "mt-1 h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13px] text-[#22262b] outline-none";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#22262b]/20 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Yeni mesaj"
        onSubmit={(event) => {
          event.preventDefault();
          if (!chosen) return;
          onStart({
            programId,
            organizationId:
              chosen.type === CoordinatorConversationCounterpart.Team
                ? chosen.id
                : null,
            mentorId:
              chosen.type === CoordinatorConversationCounterpart.Mentor
                ? chosen.id
                : null,
          });
        }}
        className="w-full max-w-[420px] space-y-4 rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(33,38,43,0.18)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[#22262b]">
            Yeni mesaj
          </h2>
          <button type="button" aria-label="Kapat" onClick={onClose}>
            <X aria-hidden className="size-4 text-[#858c96]" />
          </button>
        </div>
        <label className="block text-[12.5px] text-[#676e78]">
          Program
          <select
            value={programId}
            onChange={(event) => {
              setProgramId(event.target.value);
              setTarget("");
            }}
            className={field}
          >
            <option value="">Seçin</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12.5px] text-[#676e78]">
          Kime
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            disabled={!programId || detail.isLoading}
            className={field}
          >
            <option value="">
              {detail.isLoading ? "Yükleniyor…" : "Takım veya mentor seçin"}
            </option>
            {targets.map((option) => (
              <option
                key={`${option.type}:${option.id}`}
                value={`${option.type}:${option.id}`}
              >
                {option.name} · {COUNTERPART_LABELS[option.type]}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <p role="alert" className="text-[12.5px] text-[#d9464b]">
            {error.message}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-[#e9ecef] px-4 text-[13px]"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={!chosen || starting}
            className="h-10 rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white disabled:bg-[#858c96]"
          >
            {starting ? "Açılıyor…" : "Konuşmayı aç"}
          </button>
        </div>
      </form>
    </div>
  );
}
