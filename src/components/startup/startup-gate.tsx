"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { startupPrimaryActionClass } from "@/components/startup/startup-page-frame";
import { useIndividualProgram } from "@/hooks/use-individual-program";
import { useStartupAccess } from "@/hooks/use-startup-access";
import { StartupAccess, startupGate } from "@/lib/startup-access";
import { STUDENT_FILES_HREF } from "@/lib/startup-tabs";

const MESSAGE_KEYS = {
  [StartupAccess.None]: "none",
  [StartupAccess.Pending]: "pending",
  [StartupAccess.Rejected]: "rejected",
} as const;

const STUDENT_MESSAGE_KEYS = {
  [StartupAccess.Pending]: "student.pending",
  [StartupAccess.Rejected]: "student.rejected",
} as const;

/** Stands in for a page that needs a startup the mentee does not have yet, or one still waiting for approval. */
export function StartupGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { access, isLoading } = useStartupAccess();
  // Hold a startup-only page until its approval is known, so a waiting startup never sees it flash.
  if (isLoading && startupGate(pathname, StartupAccess.Pending)) return null;
  const gate = startupGate(pathname, access);
  if (gate === null) return children;
  return <StartupEmptyState access={gate} />;
}

export function StartupEmptyState({
  access,
}: {
  access: Exclude<StartupAccess, StartupAccess.Ready>;
}) {
  const t = useTranslations("startupGate");
  const { individual } = useIndividualProgram();
  // A student waits on their application, not a startup; Dosyalar stays open meanwhile and carries the resubmit banner.
  const student = individual && access !== StartupAccess.None;
  const key =
    individual && access !== StartupAccess.None
      ? STUDENT_MESSAGE_KEYS[access]
      : MESSAGE_KEYS[access];
  return (
    <section className="mx-auto mt-10 flex max-w-[560px] flex-col items-center gap-3 rounded-[24px] border border-[#e4e7ea] bg-white px-6 py-10 text-center">
      <h1 className="text-[17px] font-semibold leading-6 text-[#22262b]">
        {t(`${key}.title`)}
      </h1>
      <p className="text-[13px] leading-5 text-[#676e78]">{t(`${key}.body`)}</p>
      <Link
        href={student ? STUDENT_FILES_HREF : "/startup"}
        className={`${startupPrimaryActionClass} mt-2`}
      >
        {student ? t("student.goToProject") : t("goToStartup")}
      </Link>
    </section>
  );
}
