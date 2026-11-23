// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

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
  recipients,
  isTicked,
  onToggle,
  filters,
}: {
  title: string;
  recipients: EmailRecipient[];
  isTicked?: (id: string) => boolean;
  onToggle?: (id: string) => void;
  filters?: { id: RecipientFilter; label: string }[];
}) {
  const t = useTranslations("emailCenter");
  const list = useRecipientList(recipients);

  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[15px] font-semibold text-[#22262b]">{title}</h3>
        <div className="flex">
          <SearchField
            value={list.search}
            onChange={list.setSearch}
            placeholder={t("search")}
            ariaLabel={t("searchIn", { list: title })}
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
        {list.hasNoMatch ? <EmptyNote>{t("noMatch")}</EmptyNote> : null}
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
                    className="mt-1.5 size-5 shrink-0 accent-[#22262b] sm:mt-0"
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
                    <p className="text-[12.5px] text-[#858c96]">
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
