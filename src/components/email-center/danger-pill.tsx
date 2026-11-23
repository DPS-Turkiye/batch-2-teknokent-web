// TEST UI: placeholder until the design team's screen; replace when it arrives.
import type { ReactNode } from "react";

import { DangerButton } from "@/components/common/danger-button";

/** The danger colour in the pill shape of the buttons beside it. */
export function DangerPill({
  children,
  disabled = false,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <DangerButton
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-full! text-[13px]! font-medium!"
    >
      {children}
    </DangerButton>
  );
}
