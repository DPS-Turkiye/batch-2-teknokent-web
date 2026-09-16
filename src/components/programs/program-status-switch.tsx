"use client";

import { ToggleSwitch } from "@/components/common/toggle-switch";
import { useProgramStatusSwitch } from "@/hooks/use-programs";
import type { Program } from "@/interfaces/program";

export function ProgramStatusSwitch({ program }: { program: Program }) {
  const status = useProgramStatusSwitch(program);

  return (
    <div className="flex items-center gap-2 text-xs text-[#4a5059]">
      <ToggleSwitch
        checked={status.active}
        label={`${program.name} aktif`}
        disabled={status.isSaving}
        onChange={() => void status.toggle()}
      />
      <span>{status.label}</span>
    </div>
  );
}
