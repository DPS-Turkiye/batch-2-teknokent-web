"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useTranslations } from "next-intl";

import {
  PageHeading,
  SearchField,
  StatusChip,
} from "@/components/admin/admin-ui";
import {
  PersonLine,
  WorkspaceList,
  WorkspaceRow,
} from "@/components/academician/workspace-ui";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import { EmptyState } from "@/components/common/empty-state";
import { useAcademicianAdvisees } from "@/hooks/use-academician-advisees";

export function AdviseesView() {
  const t = useTranslations("academicianWorkspace.advisees");
  const levels = useTranslations("academicianWorkspace.studyLevel");
  const advisees = useAcademicianAdvisees();
  const loaded = !advisees.isLoading && !advisees.error;
  return (
    <div className="space-y-6">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <WorkspaceQueryState
        isLoading={advisees.isLoading}
        error={advisees.error}
        onRetry={advisees.retry}
        isRetrying={advisees.isRetrying}
      />
      {loaded && advisees.total === 0 ? (
        <EmptyState accent="blue" title={t("empty")} />
      ) : null}
      {loaded && advisees.total > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchField
              value={advisees.search}
              onChange={advisees.setSearch}
              placeholder={t("search")}
            />
            <p className="text-[13px] text-[#676e78]">
              {t("count", { count: advisees.total })}
            </p>
          </div>
          {advisees.advisees.length === 0 ? (
            <EmptyState accent="blue" title={t("noMatch")} />
          ) : (
            <WorkspaceList label={t("title")}>
              {advisees.advisees.map((person) => (
                <WorkspaceRow
                  key={`${person.userId ?? "none"}-${person.fullName}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <PersonLine
                      name={person.fullName}
                      detail={[
                        person.departmentName,
                        person.programLevel
                          ? levels(person.programLevel)
                          : null,
                        person.classYear
                          ? t("classYear", { year: person.classYear })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                    {person.userId ? null : (
                      <StatusChip tone="neutral">{t("notSignedIn")}</StatusChip>
                    )}
                  </div>
                </WorkspaceRow>
              ))}
            </WorkspaceList>
          )}
        </>
      ) : null}
    </div>
  );
}
