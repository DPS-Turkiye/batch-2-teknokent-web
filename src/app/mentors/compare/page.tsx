"use client";

import { AppShell } from "@/components/hoc/app-shell";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { Avatar } from "@/components/common/avatar";
import { MENTOR_COMPARE_COLUMNS, MENTOR_COMPARISON_ROWS } from "@/lib/const";

export default function MentorComparisonPage() {
  return (
    <AppShell title="Mentor Karşılaştırması" backHref="/mentor-request">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
          <table className="min-w-[800px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#fafafa]">
                <th className="w-1/4 p-4 text-left" />
                {MENTOR_COMPARE_COLUMNS.map(([initials, name, label]) => (
                  <th key={name} className="w-1/4 p-4 text-left font-medium">
                    <span className="flex items-center gap-3">
                      <Avatar initials={initials} size="sm" />
                      {name}
                    </span>
                    {label ? (
                      <span className="mt-3 block text-xs">{label}</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MENTOR_COMPARISON_ROWS.map((row, index) => (
                <tr
                  key={row[0]}
                  className={index % 2 ? "bg-[#fafafa]" : "bg-white"}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${row[0]}-${cellIndex}`}
                      className={`p-4 ${cellIndex === 0 ? "text-[#777]" : "text-[#444]"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {MENTOR_COMPARE_COLUMNS.map(([, name]) => (
                  <td key={name} className="p-4">
                    <SecondaryButton className="mb-2 w-full border-0">
                      Profili Görüntüle
                    </SecondaryButton>
                    <PrimaryButton href="/mentor-request" className="w-full">
                      Bu Mentoru Seç
                    </PrimaryButton>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
