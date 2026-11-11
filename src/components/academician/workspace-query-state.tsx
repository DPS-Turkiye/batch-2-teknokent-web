"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useTranslations } from "next-intl";

/** Loading and load-failure states shared by the academician screens; renders nothing once loaded. */
export function WorkspaceQueryState({
  isLoading,
  error,
  onRetry,
  isRetrying = false,
}: {
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  const t = useTranslations("academicianWorkspace.queryState");
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-[#858c96]">
        {t("loading")}
      </p>
    );
  }
  if (!error) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
      <p className="text-[#d9464b]">{t("error")}</p>
      <button
        type="button"
        className="rounded-full border border-[#d4d8dd] px-4 py-2 text-[#22262b] disabled:opacity-60"
        disabled={isRetrying}
        onClick={onRetry}
      >
        {t("retry")}
      </button>
    </div>
  );
}
