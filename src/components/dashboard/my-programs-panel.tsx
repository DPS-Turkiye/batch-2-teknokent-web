"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { SectionHeader } from "@/components/mentee-home/section-header";
import { SectionPlaceholder } from "@/components/mentee-home/section-placeholder";
import { useAppSession } from "@/components/providers/session-provider";
import { useOrganizationPrograms, usePrograms } from "@/hooks/use-programs";
import { UserRole } from "@/interfaces/session";
import { programsMentorHasJoined } from "@/lib/meeting-targets";
import { programDetailHref } from "@/lib/program-links";

export function MyProgramsPanel({
  variant = "mentee",
}: {
  variant?: "mentee" | "mentor";
}) {
  const t = useTranslations("myPrograms");
  const session = useAppSession();
  const orgPrograms = useOrganizationPrograms({
    enabled: variant === "mentee",
  });
  const mentorPrograms = usePrograms({ enabled: variant === "mentor" });

  const items = useMemo(() => {
    if (variant === "mentor") {
      return programsMentorHasJoined(
        mentorPrograms.data ?? [],
        session?.userId,
      ).map((program) => ({ id: program.id, name: program.name }));
    }
    return (orgPrograms.data?.programs ?? []).map((program) => ({
      id: program.id,
      name: program.name,
    }));
  }, [
    variant,
    mentorPrograms.data,
    orgPrograms.data?.programs,
    session?.userId,
  ]);

  const loading =
    variant === "mentor" ? mentorPrograms.isLoading : orgPrograms.isLoading;
  const error = variant === "mentor" ? mentorPrograms.error : orgPrograms.error;

  return (
    <section
      aria-labelledby="home-programs-title"
      className="flex flex-col gap-3"
    >
      <SectionHeader id="home-programs-title" title={t("title")} />
      {loading ? (
        <SectionPlaceholder loading emptyText="" />
      ) : error ? (
        <SectionPlaceholder loading={false} emptyText={t("failed")} />
      ) : items.length === 0 ? (
        <SectionPlaceholder loading={false} emptyText={t("empty")} />
      ) : (
        <div className="space-y-[10px]">
          {items.map((program) => (
            <Link
              key={program.id}
              href={programDetailHref(program.id)}
              className="flex items-center justify-between gap-3 rounded-[20px] border-[0.685px] border-[#dde1e6] bg-white px-4 py-3.5 transition hover:border-[#f2b78f]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-[21px] text-[#2b303a]">
                  {program.name}
                </p>
                <p className="mt-0.5 text-xs leading-[18px] text-[#7a828d]">
                  {session?.role === UserRole.Mentor
                    ? t("mentorLink")
                    : t("menteeLink")}
                </p>
              </div>
              <span className="shrink-0 text-[12.5px] font-semibold text-[#565e68]">
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
