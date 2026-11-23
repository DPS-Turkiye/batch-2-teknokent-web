// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import type { EmailRecipient } from "@/interfaces/email-center";

/** People on a mail: with tick boxes in the review, with what became of each mail afterwards. */
export function RecipientTable({
  caption,
  recipients,
  isTicked,
  onToggle,
}: {
  caption: string;
  recipients: EmailRecipient[];
  isTicked?: (id: string) => boolean;
  onToggle?: (id: string) => void;
}) {
  const t = useTranslations("emailCenter");
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e4e7ea] bg-white">
      <table className="w-full text-left text-sm">
        <caption className="px-4 py-3 text-left text-sm font-semibold text-[#22262b]">
          {caption}
        </caption>
        <thead className="text-xs text-[#858c96]">
          <tr>
            {onToggle ? <th scope="col" className="px-4 py-2" /> : null}
            <th scope="col" className="px-4 py-2 font-medium">
              {t("columns.name")}
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              {t("columns.address")}
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              {t("columns.team")}
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              {t("columns.account")}
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              {t("columns.status")}
            </th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((row) => (
            <tr key={row.id} className="border-t border-[#eef0f2]">
              {onToggle ? (
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    aria-label={t("include", { name: row.fullName })}
                    checked={isTicked?.(row.id) ?? false}
                    onChange={() => {
                      onToggle(row.id);
                    }}
                    className="size-4 accent-[#e86f22]"
                  />
                </td>
              ) : null}
              <td className="px-4 py-2 text-[#22262b]">{row.fullName}</td>
              <td className="px-4 py-2">{row.address ?? "–"}</td>
              <td className="px-4 py-2">
                {row.teamName ?? t(`kinds.${row.kind}`)}
              </td>
              <td className="px-4 py-2">
                {row.accountStatus
                  ? t(`accountStatuses.${row.accountStatus}`)
                  : t("accountStatuses.none")}
              </td>
              <td className="px-4 py-2">
                {row.exclusion
                  ? t(`exclusions.${row.exclusion}`)
                  : t(`statuses.${row.status}`)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
