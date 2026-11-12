"use client";

import { Info, Lock, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { StudentAvatar } from "@/components/academician/student-avatar";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import { Button, ButtonSize, ButtonVariant } from "@/components/ia/button";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import {
  useAcademicianAdvisees,
  type AcademicianAdvisees,
  type AdviseeTableRow,
} from "@/hooks/use-academician-advisees";

/** "Danışan Öğrencilerim": ODTÜ's advisee list with each student's meetings, read-only. */
export function AdviseesView() {
  const t = useTranslations("iaAcademician.advisees");
  const { list, ...state } = useAcademicianAdvisees();
  return (
    <div className="space-y-6">
      <h1 className="sr-only">{t("title")}</h1>
      {list ? (
        <AdviseesContent list={list} />
      ) : (
        <WorkspaceQueryState
          isLoading={state.isLoading}
          error={state.error}
          onRetry={state.retry}
          isRetrying={state.isRetrying}
        />
      )}
    </div>
  );
}

function AdviseesContent({ list }: { list: AcademicianAdvisees }) {
  const t = useTranslations("iaAcademician.advisees");
  const tCommon = useTranslations("iaAcademician.common");
  if (list.total === 0) {
    return (
      <p className="rounded-2xl bg-background-subtle px-5 py-4 type-body-sm text-text-secondary">
        {t("empty")}
      </p>
    );
  }
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex h-11 w-full max-w-sm items-center gap-2 rounded-input border border-border-control bg-background-surface px-3 focus-within:outline-2 focus-within:outline-border-selected">
          <Search aria-hidden className="size-4 text-icon-muted" />
          <span className="sr-only">{t("search")}</span>
          <input
            type="search"
            value={list.search}
            onChange={(event) => {
              list.setSearch(event.target.value);
            }}
            placeholder={t("search")}
            className="w-full bg-transparent type-body-sm text-text-primary outline-none placeholder:text-text-placeholder"
          />
        </label>
        <StatusBadge
          tone={StatusTone.Neutral}
          icon={<Lock aria-hidden className="size-3.5" />}
        >
          {t("readOnly")}
        </StatusBadge>
      </div>
      {list.meetings.failed ? (
        <InlineAlert tone={StatusTone.Warning} title={t("meetingsFailed")}>
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Small}
            disabled={list.meetings.isRetrying}
            onClick={list.meetings.retry}
            className="mt-2"
          >
            {tCommon("retry")}
          </Button>
        </InlineAlert>
      ) : null}
      {list.rows.length > 0 ? (
        <AdviseesTable rows={list.rows} total={list.total} />
      ) : (
        <p className="rounded-2xl bg-background-subtle px-5 py-4 type-body-sm text-text-secondary">
          {t("noMatch")}
        </p>
      )}
      <p className="flex items-start gap-2 type-caption text-text-muted">
        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {t("footnote")}
      </p>
    </>
  );
}

function AdviseesTable({
  rows,
  total,
}: {
  rows: AdviseeTableRow[];
  total: number;
}) {
  const t = useTranslations("iaAcademician.advisees");
  return (
    <div className="overflow-x-auto rounded-card border border-border-default bg-background-surface">
      <table className="w-full min-w-[720px] text-left">
        <caption className="sr-only">
          {`${t("title")} · ${t("count", { count: total })}`}
        </caption>
        <thead>
          <tr className="border-b border-border-subtle">
            <th scope="col" className="px-6 py-4 type-caption text-text-muted">
              {t("columns.student")}
            </th>
            <th scope="col" className="px-4 py-4 type-caption text-text-muted">
              {t("columns.program")}
            </th>
            <th scope="col" className="px-4 py-4 type-caption text-text-muted">
              {t("columns.last")}
            </th>
            <th scope="col" className="px-4 py-4 type-caption text-text-muted">
              {t("columns.next")}
            </th>
            <th scope="col" className="px-6 py-4">
              <span className="sr-only">{t("columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {rows.map((row) => (
            <AdviseeRowView key={row.key} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdviseeRowView({ row }: { row: AdviseeTableRow }) {
  const t = useTranslations("iaAcademician.advisees");
  return (
    <tr>
      <th scope="row" className="px-6 py-3 font-normal">
        <span className="flex items-center gap-3">
          <StudentAvatar name={row.name} />
          {row.href === null ? (
            <span className="type-label text-text-primary">{row.name}</span>
          ) : (
            <Link
              href={row.href}
              className="type-label text-text-primary hover:underline"
            >
              {row.name}
            </Link>
          )}
        </span>
      </th>
      <td className="px-4 py-3 type-body-sm text-text-secondary">
        {row.detail}
      </td>
      <td className="px-4 py-3 type-body-sm text-text-secondary">
        {row.last ?? t("none")}
      </td>
      <td
        className={`px-4 py-3 type-body-sm ${
          row.next?.pending ? "text-status-warning-text" : "text-text-primary"
        }`}
      >
        {row.next?.label ?? t("none")}
      </td>
      <td className="px-6 py-3 text-right">
        {row.href === null ? (
          <StatusBadge tone={StatusTone.Neutral}>
            {t("notSignedIn")}
          </StatusBadge>
        ) : (
          <Button
            variant={ButtonVariant.Ghost}
            size={ButtonSize.Small}
            href={row.href}
          >
            <span aria-hidden>{t("appointments")}</span>
            <span className="sr-only">
              {t("appointmentsLabel", { name: row.name })}
            </span>
          </Button>
        )}
      </td>
    </tr>
  );
}
