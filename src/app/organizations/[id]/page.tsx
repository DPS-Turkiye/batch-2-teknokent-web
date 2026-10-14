"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { useAppSession } from "@/components/providers/session-provider";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import type { OrganizationMember } from "@/interfaces/organization-member";
import { DocumentKind } from "@/interfaces/startup-document";
import { UserRole } from "@/interfaces/session";
import { getOrganizationById } from "@/lib/client/organization";
import { getOrganizationMembersById } from "@/lib/client/organization-members";
import { getOrganizationDocuments } from "@/lib/client/startup-documents";
import {
  STARTUP_INFO_BODY_CLASS,
  STARTUP_INFO_CARD_CLASS,
  STARTUP_INFO_CARD_TITLE_CLASS,
} from "@/lib/const/programs";
import { programPersonHref } from "@/lib/program-links";
import { formatFileSize, formatLongDate, initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

export function OrganizationStartupDetail({
  organizationId,
}: {
  organizationId: string;
}) {
  const t = useTranslations("organizationStartup");
  const locale = useLocale();
  const session = useAppSession();
  const openDocument = useOpenDocument();
  const isMentor = session?.role === UserRole.Mentor;

  const profileQuery = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: () => getOrganizationById(organizationId),
    enabled: Boolean(organizationId) && isMentor,
  });
  const membersQuery = useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: () => getOrganizationMembersById(organizationId),
    enabled: Boolean(organizationId) && isMentor,
  });
  const documentsQuery = useQuery({
    queryKey: ["organization-documents", organizationId],
    queryFn: () => getOrganizationDocuments(organizationId),
    enabled: Boolean(organizationId) && isMentor,
  });

  const profile = profileQuery.data ?? null;
  const members = membersQuery.data ?? [];
  const documents = useMemo(
    () => documentsQuery.data ?? [],
    [documentsQuery.data],
  );
  const canvas = useMemo(
    () =>
      documents.find((document) => document.kind === DocumentKind.Canvas) ??
      null,
    [documents],
  );
  const files = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.kind !== DocumentKind.Canvas &&
          document.kind !== DocumentKind.Logo,
      ),
    [documents],
  );

  const isLoading =
    profileQuery.isLoading ||
    membersQuery.isLoading ||
    documentsQuery.isLoading;
  const homeHref =
    session?.role === UserRole.Mentor ? "/mentor-dashboard" : "/dashboard";

  return (
    <AppShell
      active={AppArea.Home}
      mentorHome={session?.role === UserRole.Mentor}
      menteeHome={session?.role === UserRole.Mentee}
    >
      <div className="mx-auto w-full max-w-[960px] px-4 pb-16 pt-3 sm:px-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#676e78]">
          <Link href={homeHref} className="hover:text-[#22262b]">
            {t("home")}
          </Link>
          <span>›</span>
          <span className="font-medium text-[#4a5059]">
            {profile?.name ?? t("startupFallback")}
          </span>
        </nav>

        {session && !isMentor ? (
          <p
            role="alert"
            className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {t("mentorOnly")}
          </p>
        ) : isLoading ? (
          <p className="mt-10 text-sm text-[#858c96]">{t("loading")}</p>
        ) : !profile ? (
          <p
            role="alert"
            className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {profileQuery.error?.message ?? t("notFound")}
          </p>
        ) : (
          <>
            <header className="mt-6 flex items-center gap-3.5">
              <div className="grid size-14 place-items-center rounded-xl bg-[#fdebdd] text-base font-semibold text-[#e86f22]">
                {initials(profile.name)}
              </div>
              <div>
                <h1 className="text-[28px] font-semibold text-[#22262b]">
                  {profile.name}
                </h1>
                <p className="mt-1 text-sm text-[#676e78]">
                  {[profile.sector, profile.fundingStage || profile.maturity]
                    .filter(Boolean)
                    .join(" · ") || t("profileFallback")}
                </p>
              </div>
            </header>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Metric
                label={t("stage")}
                value={profile.fundingStage || profile.maturity || "—"}
              />
              <Metric label={t("sector")} value={profile.sector || "—"} />
              <Metric
                label={t("program")}
                value={profile.programLevel || "—"}
              />
            </div>

            <div className="mt-6 grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-[18px]">
                <section className={STARTUP_INFO_CARD_CLASS}>
                  <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                    {t("about")}
                  </h2>
                  <p className={STARTUP_INFO_BODY_CLASS}>
                    {profile.description?.trim() || t("noDescription")}
                  </p>
                </section>
                <section className={STARTUP_INFO_CARD_CLASS}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                      {t("canvas")}
                    </h2>
                    {canvas ? (
                      <button
                        type="button"
                        onClick={() => void openDocument(canvas.id)}
                        className="text-[12.5px] font-medium text-[#9e4400] hover:underline"
                      >
                        {t("view")}
                      </button>
                    ) : null}
                  </div>
                  {canvas ? (
                    <p className={STARTUP_INFO_BODY_CLASS}>
                      {canvas.originalFilename}
                    </p>
                  ) : (
                    <p className={STARTUP_INFO_BODY_CLASS}>{t("noCanvas")}</p>
                  )}
                </section>
                {files.length > 0 ? (
                  <section className={STARTUP_INFO_CARD_CLASS}>
                    <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>
                      {t("files")}
                    </h2>
                    <ul className="space-y-2">
                      {files.map((document) => (
                        <li key={document.id}>
                          <button
                            type="button"
                            onClick={() => void openDocument(document.id)}
                            className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#e4e7ea] px-3.5 py-3 text-left hover:border-[#f2b78f]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-medium text-[#22262b]">
                                {document.originalFilename}
                              </span>
                              <span className="block truncate text-[11.5px] text-[#858c96]">
                                {formatFileSize(document.sizeBytes)} ·{" "}
                                {formatLongDate(document.createdAt, locale)}
                              </span>
                            </span>
                            <Image
                              src="/startup/paper.svg"
                              alt=""
                              width={20}
                              height={20}
                              className="size-5 shrink-0"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
              <aside className={STARTUP_INFO_CARD_CLASS}>
                <h2 className={STARTUP_INFO_CARD_TITLE_CLASS}>{t("team")}</h2>
                {members.length === 0 ? (
                  <p className={STARTUP_INFO_BODY_CLASS}>{t("noTeam")}</p>
                ) : (
                  <ul className="space-y-3">
                    {members.map((member) => (
                      <MemberRow key={member.id} member={member} />
                    ))}
                  </ul>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#f2b78f] px-5 py-3">
      <p className="text-[11px] text-[#858c96]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[#22262b]">{value}</p>
    </div>
  );
}

function MemberRow({ member }: { member: OrganizationMember }) {
  const t = useTranslations("organizationStartup");
  return (
    <Link
      href={programPersonHref({ userId: member.id })}
      className="flex items-center gap-2.5 rounded-lg hover:bg-[#f7f8f9]"
    >
      <span className="grid size-9 place-items-center rounded-full bg-[#fdebdd] text-[11px] font-medium text-[#a8480e]">
        {initials(member.fullName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-[#22262b]">
          {member.fullName}
        </span>
        <span className="block truncate text-[11.5px] text-[#858c96]">
          {[member.jobTitle, member.founder ? t("founder") : null]
            .filter(Boolean)
            .join(" · ") || t("memberFallback")}
        </span>
      </span>
    </Link>
  );
}

export default function OrganizationStartupPage() {
  const params = useParams<{ id: string }>();
  return <OrganizationStartupDetail organizationId={params.id} />;
}
