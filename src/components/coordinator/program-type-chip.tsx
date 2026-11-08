"use client";

import { useTranslations } from "next-intl";

import { StatusChip } from "@/components/admin/admin-ui";
import type { ProgramType } from "@/interfaces/program";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
export function ProgramTypeChip({ type }: { type: ProgramType }) {
  const t = useTranslations("programTypes");
  return <StatusChip tone="blue">{t(type)}</StatusChip>;
}
