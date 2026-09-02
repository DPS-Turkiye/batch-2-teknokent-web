"use client";

import { Check, ChevronDown, FolderKanban } from "lucide-react";
import { useState } from "react";

import {
  useOrganizationPrograms,
  useSetActiveProgram,
} from "@/hooks/use-programs";

const NO_PROGRAM_LABEL = "Bir programa dahil değilim";

export function ActiveProgramPicker() {
  const programsQuery = useOrganizationPrograms();
  const setActive = useSetActiveProgram();
  const [open, setOpen] = useState(false);

  const programs = programsQuery.data?.programs ?? [];
  const activeId = programsQuery.data?.activeProgramId ?? null;
  const active = programs.find((program) => program.id === activeId) ?? null;

  function choose(programId: string | null) {
    setOpen(false);
    if (programId === activeId) return;
    setActive.mutate(programId);
  }

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
        <div className="relative mt-4">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={setActive.isPending}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#e4e7ea] bg-white px-4 text-sm font-medium text-[#22262b] transition hover:border-[#f2b78f] disabled:opacity-60"
          >
            <span className={active ? "" : "text-[#6a7282]"}>
              {active ? active.name : NO_PROGRAM_LABEL}
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-[#676e78] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <div
            role="listbox"
            aria-label="Dahil olduğum program"
            hidden={!open}
            className="absolute left-0 right-0 top-[52px] z-20 origin-top overflow-hidden rounded-xl border border-[#e4e7ea] bg-white p-1 shadow-xl transition duration-200"
          >
            {[null, ...programs.map((program) => program.id)].map((id) => {
              const program = programs.find((entry) => entry.id === id) ?? null;
              const selected = id === activeId;
              return (
                <button
                  key={id ?? "none"}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-[#fdebdd] text-[#c85816]"
                      : "text-[#3c424a] hover:bg-[#f8f9fa]"
                  }`}
                >
                  <span>
                    {program ? program.name : NO_PROGRAM_LABEL}
                    {program ? (
                      <span className="block text-xs text-[#858c96]">
                        {program.coordinatorName}
                      </span>
                    ) : null}
                  </span>
                  {selected ? <Check className="size-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>

          {setActive.error ? (
            <p className="mt-3 text-sm text-[#b91c1c]" role="alert">
              {setActive.error.message}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
