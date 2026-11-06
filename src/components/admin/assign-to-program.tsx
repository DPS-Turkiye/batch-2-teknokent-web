"use client";

import { useTranslations } from "next-intl";

import { useAssignToProgram } from "@/hooks/use-assign-to-program";
import type {
  AdminProgram,
  ProgramMemberKind,
} from "@/interfaces/admin-overview";

/** "Programa ata" in the admin drawers: pick an open program and add the mentor or startup at once. */
export function AssignToProgram({
  kind,
  targetId,
  programs,
}: {
  kind: ProgramMemberKind;
  targetId: string;
  programs: AdminProgram[];
}) {
  const t = useTranslations("adminUsers");
  const assign = useAssignToProgram(kind, targetId, programs);
  if (programs.length === 0) {
    return <p className="text-[12.5px] text-[#858c96]">{t("noOpenProgram")}</p>;
  }

  return (
    <form
      aria-label={t("assignToProgram")}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        assign.save();
      }}
    >
      <select
        aria-label={t("programToAssign")}
        value={assign.programId}
        onChange={(event) => assign.select(event.target.value)}
        className="min-w-0 flex-1 rounded-full border border-[#e9ecef] bg-white px-4 py-[9px] text-[13px] text-[#22262b]"
      >
        <option value="">{t("chooseProgram")}</option>
        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!assign.canSave}
        className="rounded-full bg-[#22262b] px-4 py-[9px] text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
      >
        {assign.saving ? t("assigning") : t("assignToProgram")}
      </button>
    </form>
  );
}
