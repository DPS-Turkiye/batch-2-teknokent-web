import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppointmentsFilter } from "@/types/academician-calendar";

const FILTERS = Object.values(AppointmentsFilter);

/** "Tümü / Randevular / Talepler · 4 / Müsaitlik": what the calendar shows. */
export function AppointmentsFilterChips({
  value,
  onChange,
  requestCount,
}: {
  value: AppointmentsFilter;
  onChange: (filter: AppointmentsFilter) => void;
  requestCount: number;
}) {
  const t = useTranslations("iaAcademician.appointments");
  return (
    <div
      role="group"
      aria-label={t("filtersLabel")}
      className="flex flex-wrap gap-2"
    >
      {FILTERS.map((filter) => {
        const selected = filter === value;
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              onChange(filter);
            }}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 type-label transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-selected ${
              selected
                ? "border-brand-odtu-strong bg-brand-odtu-bg text-brand-odtu-strong"
                : "border-border-default bg-background-surface text-text-primary hover:bg-background-subtle"
            }`}
          >
            {selected ? <Check aria-hidden className="size-4" /> : null}
            {t(`filters.${filter}`, { count: requestCount })}
          </button>
        );
      })}
    </div>
  );
}
