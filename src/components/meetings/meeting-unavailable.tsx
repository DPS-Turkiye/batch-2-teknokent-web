import Link from "next/link";
import { useTranslations } from "next-intl";

export function MeetingUnavailable({
  error,
  isLoading,
}: {
  error: unknown;
  isLoading: boolean;
}) {
  const t = useTranslations("meetingPages.unavailable");
  const message = isLoading
    ? t("loading")
    : error
      ? t("failed")
      : t("notFound");

  return (
    <section className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#e4e7ea] bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-[#22262b]">{message}</h1>
      {!isLoading ? (
        <Link
          href="/meetings"
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#e86f22] px-5 text-sm font-semibold text-white"
        >
          {t("back")}
        </Link>
      ) : null}
    </section>
  );
}
