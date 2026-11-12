"use client";

import { useTranslations } from "next-intl";

import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { useProductTourReplay } from "@/hooks/use-product-tour";
import type { Workspace } from "@/interfaces/workspace";

/** "Turu tekrar izle" for Profilim; nothing when the workspace has no tour. */
export function ProductTourReplayButton({
  workspace,
}: {
  workspace: Workspace;
}) {
  const t = useTranslations("iaTour");
  const { available, replay } = useProductTourReplay(workspace);
  if (!available) return null;
  return (
    <Button
      variant={ButtonVariant.Ghost}
      size={ButtonSize.Small}
      onClick={replay}
    >
      {t("replay")}
    </Button>
  );
}
