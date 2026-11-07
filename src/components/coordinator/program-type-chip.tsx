"use client";

import { useTranslations } from "next-intl";

import { StatusChip } from "@/components/admin/admin-ui";
import type { ProgramType } from "@/interfaces/program";

// TEST UI: no Figma frame for the program-type label yet.
export function ProgramTypeChip({ type }: { type: ProgramType }) {
  const t = useTranslations("programTypes");
  return <StatusChip tone="blue">{t(type)}</StatusChip>;
}
