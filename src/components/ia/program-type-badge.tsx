import { useTranslations } from "next-intl";
import Image from "next/image";

import { ProgramType } from "@/interfaces/program";

export const PROGRAM_TYPE_ICONS: Record<ProgramType, string> = {
  [ProgramType.StartupMentoring]: "/ia/icons/startup-mentoring.svg",
  [ProgramType.PeerMentoring]: "/ia/icons/peer-mentoring.svg",
  [ProgramType.OfficeHours]: "/ia/icons/office-hours.svg",
};

/** The neutral program-type label with its icon (Figma "Program Type Badge"). */
export function ProgramTypeBadge({ type }: { type: ProgramType }) {
  const t = useTranslations("programTypes");
  return (
    <span className="inline-flex h-7 w-fit items-center gap-1 rounded-full bg-background-muted pr-3 pl-2.5 whitespace-nowrap type-label-sm text-text-primary">
      <Image alt="" src={PROGRAM_TYPE_ICONS[type]} width={16} height={16} />
      {t(type)}
    </span>
  );
}
