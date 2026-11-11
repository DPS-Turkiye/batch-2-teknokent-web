"use client";

import { ArrowRight, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Avatar } from "@/components/common/avatar";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { initials } from "@/lib/utils";

const PREVIEW_LIMIT = 4;

export function TeamSummarySection() {
  const t = useTranslations("profileSections");
  const membersQuery = useOrganizationMembers();
  const members = membersQuery.data ?? [];
  const preview = members.slice(0, PREVIEW_LIMIT);
  const remaining = members.length - preview.length;

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#364153]">{t("team")}</h2>
        <Link
          href="/startup/team"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c85816] hover:underline"
        >
          {t("manageTeam")} <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {membersQuery.isLoading ? (
        <p className="mt-4 text-sm text-[#6a7282]">{t("teamLoading")}</p>
      ) : membersQuery.error ? (
        <p className="mt-4 text-sm text-[#b91c1c]">
          {membersQuery.error.message}
        </p>
      ) : members.length === 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-[#6a7282]">{t("noMembers")}</p>
          <Link
            href="/startup/team"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#e4e7ea] px-3 text-xs font-semibold text-[#3c424a] hover:border-[#f2b78f]"
          >
            <UserPlus className="size-3.5" aria-hidden />
            {t("invite")}
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {preview.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-3"
            >
              <Avatar initials={initials(member.fullName) || "??"} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#171717]">
                  {member.fullName}
                </p>
                <p className="text-xs text-[#6a7282]">
                  {member.email}
                  {member.jobTitle ? ` · ${member.jobTitle}` : ""}
                </p>
              </div>
            </div>
          ))}
          {remaining > 0 ? (
            <p className="text-xs text-[#6a7282]">
              {t("more", { count: remaining })}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
