"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { QueryNotice, StatusChip } from "@/components/admin/admin-ui";
import { ProgramGlyph } from "@/components/coordinator/program-glyph";
import { useCoordinatorProgram } from "@/hooks/use-coordinator-program";
import type { CoordinatorProgramDetail } from "@/interfaces/coordinator-program";
import { ProgramLifecycle } from "@/interfaces/coordinator-program";
import {
  programHeaderLine,
  ProgramTab,
  programTabs,
} from "@/lib/coordinator-program-detail";

const LIFECYCLE: Record<
  ProgramLifecycle,
  { label: string; tone: "green" | "blue" | "neutral" }
> = {
  [ProgramLifecycle.Active]: { label: "Aktif", tone: "green" },
  [ProgramLifecycle.Upcoming]: { label: "Yaklaşan", tone: "blue" },
  [ProgramLifecycle.Completed]: { label: "Arşivlendi", tone: "neutral" },
};

/** The program's header, counts and tabs; each tab page renders inside it. */
export function ProgramDetailFrame({
  programId,
  tab,
  children,
}: {
  programId: string;
  tab: ProgramTab;
  children: (detail: CoordinatorProgramDetail) => ReactNode;
}) {
  const query = useCoordinatorProgram(programId);
  const detail = query.data;
  if (!detail) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  const program = detail.program;
  const lifecycle = LIFECYCLE[program.lifecycle];

  return (
    <div className="space-y-6">
      <nav
        aria-label="Konum"
        className="flex items-center gap-1.5 text-[13px] text-[#858c96]"
      >
        <Link href="/coordinator/programs">Programlarım</Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span className="text-[#22262b]">{program.name}</span>
      </nav>

      <header className="flex items-start gap-4">
        <ProgramGlyph
          muted={program.lifecycle === ProgramLifecycle.Completed}
        />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-3 text-[28px] font-semibold tracking-[-0.03em] text-[#22262b]">
            {program.name}
            <StatusChip tone={lifecycle.tone}>{lifecycle.label}</StatusChip>
          </h1>
          <p className="mt-1 text-[13.5px] text-[#676e78]">
            {programHeaderLine(detail)}
          </p>
        </div>
      </header>

      <ul className="flex flex-wrap gap-2 text-[13.5px]">
        <Pill dot="#ff6a3d" value={program.teamCount} label="Takım" />
        <Pill dot="#26a4ff" value={program.mentorCount} label="Mentor" />
        <Pill value={program.activeMentorshipCount} label="Aktif mentorluk" />
        <Pill
          dot="#ff6a3d"
          value={program.awaitingMatchCount}
          label="Eşleşme bekleyen"
        />
      </ul>

      <div
        role="tablist"
        aria-label="Program bölümleri"
        className="flex overflow-x-auto border-b border-[#e9ecef]"
      >
        {programTabs(detail, programId).map((item) => {
          const active = item.id === tab;
          const content = (
            <>
              {item.label}
              {item.count != null ? (
                <span className="rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[11.5px] text-[#676e78]">
                  {item.count}
                </span>
              ) : null}
            </>
          );
          const className = `-mb-px flex shrink-0 items-center gap-2 border-b-2 px-5 pb-3 text-[14.5px] ${
            active
              ? "border-[#22262b] font-medium text-[#22262b]"
              : "border-transparent text-[#676e78]"
          }`;
          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              role="tab"
              aria-selected={active}
              className={className}
            >
              {content}
            </Link>
          ) : (
            <span
              key={item.id}
              role="tab"
              aria-selected={false}
              aria-disabled="true"
              title="Yakında"
              className={`${className} cursor-not-allowed opacity-60`}
            >
              {content}
            </span>
          );
        })}
      </div>

      {children(detail)}
    </div>
  );
}

function Pill({
  dot,
  value,
  label,
}: {
  dot?: string;
  value: number;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-3.5 py-2">
      {dot ? (
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ background: dot }}
        />
      ) : null}
      <span className="font-semibold text-[#22262b]">{value}</span>
      <span className="text-[#858c96]">{label}</span>
    </li>
  );
}
