"use client";

import { useTranslations } from "next-intl";

import { SecondaryButton } from "@/components/common/secondary-button";

export function CalendarImportModal({
  importing,
  error,
  successMessage,
  onSyncWithGoogle,
  onImportFile,
  onClose,
}: {
  importing: boolean;
  error: string | null;
  successMessage: string | null;
  onSyncWithGoogle: () => void;
  onImportFile: (file: File) => void;
  onClose: () => void;
}) {
  const t = useTranslations("calendar");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between border-b border-[#f1f2f4] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#22262b]">
              {t("importGoogle")}
            </h3>
            <p className="mt-1 text-xs text-[#676e78]">{t("import.body")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("import.close")}
            className="text-[#a4aab2] hover:text-[#676e78]"
          >
            ✕
          </button>
        </div>

        <div className="my-6 space-y-4 text-xs text-[#676e78]">
          {successMessage ? (
            <div className="rounded-xl border border-[#bbf0d4] bg-[#ecfdf3] p-4 text-center font-semibold text-[#15803d]">
              {successMessage}
            </div>
          ) : null}
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-[#f4c6a7] bg-[#fdebdd] p-4 text-center font-semibold text-[#b94f12]"
            >
              {error}
            </div>
          ) : null}

          <div className="rounded-xl border border-[#e4e7ea] bg-[#f8f9fa] p-5">
            <p className="text-center font-semibold text-[#22262b]">
              {t("import.connect")}
            </p>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                disabled={importing}
                onClick={onSyncWithGoogle}
                className="rounded-xl bg-[#2f7ff0] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#1f6fe0] disabled:opacity-50"
              >
                {importing ? t("import.connecting") : t("import.signIn")}
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-dashed border-[#e4e7ea] p-6 text-center">
            <p className="font-semibold text-[#22262b]">
              {t.rich("import.orIcs", {
                code: (chunks) => (
                  <code className="rounded bg-[#f1f2f4] px-1">{chunks}</code>
                ),
              })}
            </p>
            <input
              type="file"
              accept=".ics,text/calendar"
              disabled={importing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImportFile(file);
              }}
              className="mx-auto block text-xs text-[#676e78]"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-[#f1f2f4] pt-4">
          <SecondaryButton onClick={onClose}>
            {t("import.close")}
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
