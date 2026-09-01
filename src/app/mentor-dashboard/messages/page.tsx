"use client";

import { Avatar } from "@/components/common/avatar";
import { AppShell } from "@/components/hoc/app-shell";
import { ConversationThread } from "@/components/mentorship/conversation-thread";
import { useMentorMessages } from "@/hooks/use-mentor-messages";
import { AppArea } from "@/types/app-area";
import { initials } from "@/lib/utils";

export default function MentorMessagesPage() {
  const {
    active,
    activeId,
    conversations,
    error,
    isLoading,
    messageForm,
    select,
    viewerUserId,
  } = useMentorMessages();

  return (
    <AppShell active={AppArea.Meetings} title="Mesajlar">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-8 sm:px-8">
        {isLoading ? (
          <p className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Mesajlar yükleniyor...
          </p>
        ) : error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600"
          >
            {error.message}
          </p>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-[#e4e7ea] bg-white p-12 text-center">
            <h2 className="text-base font-semibold text-[#22262b]">
              Henüz mesajlaşma yok
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-sm text-[#676e78]">
              Bir mentorluk talebini kabul ettiğinizde, girişimle mesajlaşma
              burada açılır.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#a4aab2]">
                Görüşmeler
              </h2>
              <ul className="space-y-2">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeId;
                  const name =
                    conversation.organizationName ?? conversation.supportArea;
                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => select(conversation.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          isActive
                            ? "border-[#e86f22] bg-[#fdebdd]"
                            : "border-[#e4e7ea] bg-white hover:border-[#f2b78f]"
                        }`}
                      >
                        <Avatar
                          initials={initials(name) || "MN"}
                          tone="orange"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#22262b]">
                            {name}
                          </span>
                          <span className="block truncate text-xs text-[#676e78]">
                            {conversation.supportArea}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5 sm:p-6">
              <h2 className="text-sm font-bold text-[#22262b]">
                {active?.organizationName ?? active?.supportArea}
              </h2>
              <div className="mt-4">
                <ConversationThread
                  messages={active?.messages ?? []}
                  viewerUserId={viewerUserId}
                  value={messageForm.message}
                  onChange={messageForm.setMessage}
                  onSend={messageForm.sendMessage}
                  isSending={messageForm.isSending}
                  error={messageForm.error}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
