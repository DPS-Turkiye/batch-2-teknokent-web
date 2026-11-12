"use client";

import { useTranslations } from "next-intl";

import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";

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
  const t = useTranslations("iaAcademician.common");
  if (isLoading) {
    return (
      <p role="status" className="type-body-sm text-text-muted">
        {t("loading")}
      </p>
    );
  }
  if (!error) return null;
  return (
    <InlineAlert tone={StatusTone.Error} title={t("loadFailed")}>
      <Button
        variant={ButtonVariant.Ghost}
        size={ButtonSize.Small}
        disabled={isRetrying}
        onClick={onRetry}
        className="mt-2"
      >
        {t("retry")}
      </Button>
    </InlineAlert>
  );
}
