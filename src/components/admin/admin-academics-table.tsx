// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import {
  Avatar,
  EmptyNote,
  FilterPills,
  QueryNotice,
  ScrollTable,
  SearchField,
  StatusChip,
} from "@/components/admin/admin-ui";
import {
  useAdminAcademics,
  type AcademicsList,
} from "@/hooks/use-admin-academics";
import type { AdminAcademic } from "@/interfaces/admin-academics";
import { ACADEMIC_FILTERS } from "@/lib/admin-academics";
import { errorMessage, formatLongDate, initials } from "@/lib/utils";

const COLUMNS =
  "grid grid-cols-[minmax(240px,2fr)_minmax(180px,1.5fr)_110px_170px_110px_90px] items-center gap-4";

/** Kullanıcılar › Akademisyenler: the institution's academicians, read-only. */
export function AdminAcademicsTable() {
  const t = useTranslations("adminAcademics");
  return (
    <AcademicsTable
      academics={useAdminAcademics()}
      intro={t("intro")}
      showContact
    />
  );
}

/**
 * The academicians list, shared by the admin's Kullanıcılar and an Office Hours program's Katılımcılar.
 * Without {@code showContact} there is no e-mail or sign-in time to show (the program list leaves them out).
 */
export function AcademicsTable({
  academics,
  intro,
  showContact,
}: {
  academics: AcademicsList;
  intro: string;
  showContact: boolean;
}) {
  const t = useTranslations("adminAcademics");

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#676e78]">{intro}</p>
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
        <FilterPills
          value={academics.filter}
          onChange={academics.setFilter}
          options={ACADEMIC_FILTERS.map((id) => ({
            id,
            label: `${t(`filters.${id}`)} ${academics.counts[id]}`,
          }))}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
          <SearchField
            value={academics.search}
            onChange={academics.setSearch}
            placeholder={t("searchPlaceholder")}
          />
          <label className="flex h-10 items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-3.5 text-[13px]">
            <span className="text-[#858c96]">{t("department")}</span>
            <select
              aria-label={t("department")}
              value={academics.department ?? ""}
              onChange={(event) =>
                academics.setDepartment(event.target.value || null)
              }
              className="bg-transparent font-medium text-[#22262b] outline-none"
            >
              <option value="">{t("allDepartments")}</option>
              {academics.departments.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {academics.error ? (
        <p role="alert" className="text-sm text-[#d9464b]">
          {errorMessage(academics.error, t("loadFailed"))}
        </p>
      ) : academics.isLoading ? (
        <QueryNotice isLoading error={null} />
      ) : (
        <ScrollTable minWidth={980}>
          <div
            className={`${COLUMNS} border-b border-[#f0f2f4] px-5 py-3 text-[12px] font-medium text-[#858c96]`}
          >
            <span>{t("columns.academic")}</span>
            <span>{t("columns.department")}</span>
            <span>{t("columns.advisees")}</span>
            <span>{t("columns.signIn")}</span>
            <span>{t("columns.status")}</span>
            <span />
          </div>
          {academics.rows.length === 0 ? (
            <EmptyNote>
              {academics.total === 0 ? t("none") : t("empty")}
            </EmptyNote>
          ) : (
            academics.rows.map((row) => (
              <AcademicRow
                key={row.personId}
                row={row}
                showContact={showContact}
                onOpen={() => academics.openDrawer(row.personId)}
              />
            ))
          )}
        </ScrollTable>
      )}

      {academics.open ? (
        <AcademicDrawer
          academic={academics.open}
          showContact={showContact}
          onClose={academics.closeDrawer}
        />
      ) : null}
    </div>
  );
}

function AcademicRow({
  row,
  showContact,
  onOpen,
}: {
  row: AdminAcademic;
  showContact: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("adminAcademics");
  return (
    <div
      className={`${COLUMNS} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Avatar initials={initials(row.fullName)} tone="blue" size="lg" />
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-[#22262b]">
            {[row.academicTitle, row.fullName].filter(Boolean).join(" ")}
          </span>
          <span className="block truncate text-[12px] text-[#858c96]">
            {(showContact ? row.email : row.faculty) ?? "—"}
          </span>
        </span>
      </span>
      <span className="min-w-0 truncate text-[13px] text-[#22262b]">
        {row.departmentName ?? "—"}
      </span>
      <span className="text-[13px] text-[#22262b]">{row.adviseeCount}</span>
      <SignInCell row={row} />
      <span>
        <RecordChip active={row.active} />
      </span>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${t("open")}: ${row.fullName}`}
        className="justify-self-end rounded-full border border-[#e9ecef] px-3 py-1.5 text-[12.5px] font-medium text-[#22262b]"
      >
        {t("open")}
      </button>
    </div>
  );
}

function SignInCell({ row }: { row: AdminAcademic }) {
  const t = useTranslations("adminAcademics");
  const locale = useLocale();
  if (!row.signedIn) {
    return (
      <span className="text-[12.5px] text-[#858c96]">{t("notSignedIn")}</span>
    );
  }
  return (
    <span className="text-[12.5px] text-[#22262b]">
      {row.lastLoginAt
        ? t("lastSignIn", { date: formatLongDate(row.lastLoginAt, locale) })
        : t("signedIn")}
    </span>
  );
}

function RecordChip({ active }: { active: boolean }) {
  const t = useTranslations("adminAcademics");
  return active ? (
    <StatusChip tone="green">{t("active")}</StatusChip>
  ) : (
    <StatusChip tone="neutral">{t("inactive")}</StatusChip>
  );
}

function AcademicDrawer({
  academic,
  showContact,
  onClose,
}: {
  academic: AdminAcademic;
  showContact: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("adminAcademics");
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const department = [academic.departmentName, academic.departmentCode]
    .filter(Boolean)
    .join(" · ");
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${t("drawer.title")}: ${academic.fullName}`}
      className="admin-backdrop-in fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <aside
        className="admin-drawer-in flex h-full w-full max-w-[460px] flex-col rounded-l-[28px] bg-white shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              initials={initials(academic.fullName)}
              tone="blue"
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-[18px] font-semibold text-[#22262b]">
                {academic.fullName}
              </p>
              <p className="truncate text-[12.5px] text-[#858c96]">
                {academic.academicTitle ?? t("drawer.title")}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-[#f5f6f8]"
          >
            ×
          </button>
        </div>
        <dl className="mt-5 flex-1 space-y-3 overflow-y-auto px-6 pb-4 text-[13.5px] text-[#22262b]">
          <Field label={t("drawer.academicTitle")}>
            {academic.academicTitle ?? "—"}
          </Field>
          <Field label={t("drawer.faculty")}>{academic.faculty ?? "—"}</Field>
          <Field label={t("drawer.department")}>{department || "—"}</Field>
          {showContact ? (
            <Field label={t("drawer.email")}>{academic.email ?? "—"}</Field>
          ) : null}
          <Field label={t("drawer.record")}>
            <RecordChip active={academic.active} />
          </Field>
          <Field label={t("drawer.signIn")}>
            <SignInCell row={academic} />
          </Field>
          <Field label={t("drawer.advisees")}>
            {t("advisees", { count: academic.adviseeCount })}
          </Field>
          <Field label={t("drawer.officeHours")}>
            <span className="text-[12.5px] text-[#858c96]">
              {t("drawer.officeHoursPending")}
            </span>
          </Field>
        </dl>
        <p className="mx-6 mb-6 rounded-2xl bg-[#f5f6f8] px-4 py-3 text-[12.5px] text-[#676e78]">
          {t("drawer.readOnly")}
        </p>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
      <dt className="text-[#858c96]">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
