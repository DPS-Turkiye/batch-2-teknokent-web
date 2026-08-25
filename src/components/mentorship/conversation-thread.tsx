import { PrimaryButton } from "@/components/common/primary-button";
import type { RequestMessage } from "@/interfaces/mentorship-request";
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
  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <p className="text-xs text-zinc-500">Henüz mesaj yok.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {messages.map((message) => {
            const isOwnMessage = message.authorId === viewerUserId;
            return (
              <li
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg border p-2.5 text-xs ${
                    isOwnMessage
                      ? "border-zinc-800 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-800"
                  }`}
                >
                  <div
                    className={`mb-1 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wide ${
                      isOwnMessage ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    <span>{message.authorName}</span>
                    <span>{formatDateTime(message.createdAt)}</span>
                  </div>
                  <p>{message.body}</p>
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
          placeholder="Mesajınızı yazın..."
          className="w-full rounded-lg border border-zinc-300 p-2 text-xs focus:border-zinc-900 focus:outline-none"
        />
        {error ? (
          <p role="alert" className="text-xs text-red-700">
            {error.message}
          </p>
        ) : null}
        <div className="flex justify-end">
          <PrimaryButton disabled={!value.trim() || isSending} onClick={onSend}>
            {isSending ? "Gönderiliyor..." : "Gönder"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
