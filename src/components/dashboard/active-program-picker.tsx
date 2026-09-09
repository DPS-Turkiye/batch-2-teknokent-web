"use client";

import { FolderKanban } from "lucide-react";

import { ProgramSelect } from "@/components/common/program-select";
import { useToast } from "@/components/providers/toast-provider";
import {
  useOrganizationPrograms,
  useSetActiveProgram,
} from "@/hooks/use-programs";

const NO_PROGRAM_LABEL = "Bir programa dahil değilim";

export function ActiveProgramPicker() {
  const { showToast } = useToast();
  const programsQuery = useOrganizationPrograms();
  const setActive = useSetActiveProgram();

  const programs = programsQuery.data?.programs ?? [];
  const activeId = programsQuery.data?.activeProgramId ?? null;

  return (
    <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
      <div className="flex items-center gap-2">
        <FolderKanban className="size-4 text-[#c85816]" aria-hidden />
        <h2 className="text-base font-semibold">Dahil olduğum program</h2>
      </div>

      {programsQuery.isLoading ? (
        <p className="mt-4 text-sm text-[#6a7282]">Programlar yükleniyor…</p>
      ) : programsQuery.error ? (
        <p className="mt-4 text-sm text-[#b91c1c]">
          {programsQuery.error.message}
        </p>
      ) : programs.length === 0 ? (
        // A coordinator assigns startups to programs; until that happens there
        // is nothing to choose between, so this is a statement, not a picker.
        <p className="mt-4 text-sm text-[#6a7282]">
          Henüz bir programa eklenmediniz. Koordinatörünüz sizi bir programa
          eklediğinde burada görünecek.
        </p>
      ) : (
        <div className="mt-4">
          <ProgramSelect
            label="Dahil olduğum program"
            options={programs.map((program) => ({
              id: program.id,
              name: program.name,
              hint: program.coordinatorName,
            }))}
            value={activeId}
            onChange={(programId) =>
              setActive.mutate(programId, {
                onSuccess: () =>
                  showToast({
                    message: "Etkin program güncellendi.",
                    tone: "success",
                  }),
                onError: (error) =>
                  showToast({ message: error.message, tone: "error" }),
              })
            }
            noProgramLabel={NO_PROGRAM_LABEL}
            disabled={setActive.isPending}
          />
        </div>
      )}
    </section>
  );
}
