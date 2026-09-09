import Link from "next/link";

export function MeetingUnavailable({
  error,
  isLoading,
}: {
  error: unknown;
  isLoading: boolean;
}) {
  const message = isLoading
    ? "Toplantı yükleniyor…"
    : error
      ? "Toplantı bilgileri yüklenemedi. Lütfen tekrar deneyin."
      : "Görüntülenecek toplantı bulunamadı.";

  return (
    <section className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#e4e7ea] bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-[#22262b]">{message}</h1>
      {!isLoading ? (
        <Link
          href="/meetings"
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white"
        >
          Toplantılara dön
        </Link>
      ) : null}
    </section>
  );
}
