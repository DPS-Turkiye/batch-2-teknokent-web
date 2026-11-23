// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";

import {
  Avatar,
  EmptyNote,
  FilterPills,
  Panel,
  SearchField,
  StatusChip,
} from "@/components/admin/admin-ui";
import { ListPagination } from "@/components/common/list-pagination";
import { useRecipientList } from "@/hooks/use-recipient-list";
import {
  EmailRecipientKind,
  type EmailRecipient,
} from "@/interfaces/email-center";
import { UserAccountStatus } from "@/interfaces/session";
import { RECIPIENT_TONES } from "@/lib/email-center";
import { initials } from "@/lib/utils";
import type { RecipientFilter } from "@/types/email-center";

/** People on a mail: with tick boxes in the review, with what became of each mail afterwards. */
export function RecipientList({
  title,
  heading: Heading = "h3",
  recipients,
  isTicked,
  onToggle,
  filters,
}: {
  title: string;
  heading?: "h2" | "h3";
  recipients: EmailRecipient[];
  isTicked?: (id: string) => boolean;
  onToggle?: (id: string) => void;
  filters?: { id: RecipientFilter; label: string }[];
}) {
  const t = useTranslations("emailCenter");
  const list = useRecipientList(recipients);
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          id={headingId}
          className="text-[15px] font-semibold text-[#22262b]"
        >
          {title}
        </Heading>
        <div className="flex">
          <SearchField
            value={list.search}
            onChange={list.setSearch}
            placeholder={t("search")}
            ariaLabel={t("search")}
          />
        </div>
      </div>
      {filters ? (
        <div className="flex">
          <FilterPills
            value={list.filter}
            onChange={list.setFilter}
            options={filters}
          />
        </div>
      ) : null}
      <div role="status">
        {list.isEmpty ? <EmptyNote>{t("nobody")}</EmptyNote> : null}
        {list.isSearching && list.foundCount === 0 ? (
          <EmptyNote>{t("noMatch")}</EmptyNote>
        ) : null}
        {list.isSearching && list.foundCount > 0 ? (
          <span className="sr-only">
            {t("people", { count: list.foundCount })}
          </span>
        ) : null}
      </div>
      {list.rows.length > 0 ? (
        <Panel>
          <ul className="divide-y divide-[#f0f2f4]">
            {list.rows.map((row) => (
              <li
                key={row.id}
                className="flex items-start gap-3 px-4 py-3.5 sm:items-center sm:px-6"
              >
                {onToggle ? (
                  <input
                    type="checkbox"
                    aria-label={t("include", { name: row.fullName })}
                    checked={isTicked?.(row.id) ?? false}
                    onChange={() => {
                      onToggle(row.id);
                    }}
                    className="mt-1.5 size-5 shrink-0 scroll-mt-28 scroll-mb-24 accent-[#22262b] focus-visible:ring-2 focus-visible:ring-[#22262b] focus-visible:ring-offset-2 sm:mt-0"
                  />
                ) : null}
                <span aria-hidden className="hidden sm:block">
                  <Avatar
                    initials={initials(row.fullName)}
                    tone={
                      row.kind === EmailRecipientKind.Mentor ? "blue" : "orange"
                    }
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-[#22262b]">
                      {row.fullName}
                    </p>
                    <p className="text-[12.5px] break-all text-[#676e78]">
                      {row.address ?? t("noAddress")}
                    </p>
                    <p className="text-[12.5px] text-[#676e78]">
                      {row.teamName ?? t(`kinds.${row.kind}`)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.accountStatus === UserAccountStatus.Approved ? null : (
                      <StatusChip tone="neutral">
                        {row.accountStatus
                          ? t(`accountStatuses.${row.accountStatus}`)
                          : t("accountStatuses.none")}
                      </StatusChip>
                    )}
                    <StatusChip
                      tone={
                        row.exclusion ? "amber" : RECIPIENT_TONES[row.status]
                      }
                    >
                      {row.exclusion
                        ? t(`exclusions.${row.exclusion}`)
                        : t(`statuses.${row.status}`)}
                    </StatusChip>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <ListPagination
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        label={t("pagesOf", { list: title })}
      />
    </section>
  );
}
