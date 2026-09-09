import { BotStatus } from "@/types/assistant";

export function BotStatusRenderer({
  status,
  error,
}: {
  status: BotStatus | null;
  error: string | null;
}) {
  if (status === BotStatus.Ok) {
    return (
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--ma-green)]">
        Bot gönderildi — toplantıda kabul et; transcript burada görünecek.
      </p>
    );
  }

  if (status === BotStatus.Err) {
    return (
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--ma-danger)]">
        {error ?? "Toplantı asistanı gönderilemedi."}
      </p>
    );
  }

  return null;
}
