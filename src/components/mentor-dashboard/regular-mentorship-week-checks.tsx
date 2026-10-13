"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import {
  getMentorshipWeekChecks,
  setMentorshipWeekCheck,
} from "@/lib/client/mentorships";

export function RegularMentorshipWeekChecksPanel({
  weekStart,
}: {
  weekStart: string;
}) {
  const t = useTranslations("mentorCalendar.weekChecks");
  const queryClient = useQueryClient();
  const queryKey = ["mentorship-week-checks", weekStart] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => getMentorshipWeekChecks(weekStart),
  });

  const mutation = useMutation({
    mutationFn: setMentorshipWeekCheck,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  const items = query.data ?? [];

  return (
    <section className="rounded-xl border border-[#e4e7ea] p-[18px]">
      <h2 className="text-[15px] font-semibold">{t("title")}</h2>
      <p className="mt-2 text-xs text-[#676e78]">{t("hint")}</p>
      <div className="mt-4 space-y-3">
        {query.isLoading ? (
          <p className="text-xs text-[#858c96]">{t("loading")}</p>
        ) : query.error ? (
          <p className="text-xs text-red-600">{query.error.message}</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-[#858c96]">{t("empty")}</p>
        ) : (
          items.map((item) => (
            <label
              key={item.mentorshipId}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#eef1f4] px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={item.completed}
                disabled={mutation.isPending}
                onChange={(event) =>
                  mutation.mutate({
                    mentorshipId: item.mentorshipId,
                    weekStart,
                    completed: event.target.checked,
                  })
                }
                className="mt-0.5 h-4 w-4 accent-[#e86f22]"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#22262b]">
                  {item.organizationName}
                </span>
                <span className="block text-[11px] text-[#858c96]">
                  {t("perWeek", { count: item.daysPerWeek })}
                </span>
              </span>
            </label>
          ))
        )}
      </div>
    </section>
  );
}
