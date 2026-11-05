"use client";

import { ProgramContext } from "@/components/common/program-context";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import { UserRole } from "@/interfaces/session";
import {
  getRegularMentorships,
  searchOrganizations,
  startRegularMentorship,
} from "@/lib/client/mentorships";
import { formatCalendarDay } from "@/lib/utils";

export const REGULAR_MENTORSHIPS_QUERY_KEY = ["regular-mentorships"] as const;

export function RegularMentorshipsTab({
  role,
  canStart = false,
}: {
  role: UserRole.Mentee | UserRole.Mentor;
  canStart?: boolean;
}) {
  const t = useTranslations("regularMentorships");
  const [startOpen, setStartOpen] = useState(false);
  const query = useQuery({
    queryKey: [...REGULAR_MENTORSHIPS_QUERY_KEY, role],
    queryFn: () => getRegularMentorships(role),
  });

  if (query.isLoading) {
    return (
      <div className="mt-5 rounded-[20px] border border-[#e4e7ea] bg-white p-10 text-center text-sm text-[#676e78]">
        {t("loading")}
      </div>
    );
  }
  if (query.error) {
    return (
      <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {query.error.message}
      </div>
    );
  }

  const items = query.data ?? [];

  return (
    <section className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-[#22262b]">{t("title")}</h2>
        {canStart ? (
          <button
            type="button"
            onClick={() => setStartOpen(true)}
            className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-[var(--ms-accent,#e86f22)] px-4 text-[13px] font-medium text-white hover:bg-[var(--ms-accent-hover,#ce5e19)]"
          >
            {t("start")}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-[10px] border border-[#e4e7ea] bg-white px-6 py-[72px] text-center text-[17px] font-medium text-[#22262b]">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {items.map((item) => (
            <RegularMentorshipCard key={item.id} mentorship={item} />
          ))}
        </div>
      )}

      {startOpen ? (
        <StartRegularMentorshipDialog
          onClose={() => setStartOpen(false)}
          onCreated={() => setStartOpen(false)}
        />
      ) : null}
    </section>
  );
}

function RegularMentorshipCard({
  mentorship,
}: {
  mentorship: RegularMentorship;
}) {
  const t = useTranslations("regularMentorships");
  const locale = useLocale();
  const day = (value: string | null) =>
    value ? formatCalendarDay(value, locale) : t("noEnd");
  return (
    <Link
      href={`/mentorships/regular/${encodeURIComponent(mentorship.id)}`}
      className="block rounded-[10px] border border-[#e4e7ea] bg-white px-5 py-5 transition hover:border-[var(--ms-accent-border,#f2b78f)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-[18px] font-semibold text-[#22262b]">
            {mentorship.organizationName}
          </h3>
          <ProgramContext name={mentorship.programName} />
          <p className="mt-1 text-[13px] text-[#676e78]">
            {t("perWeek", {
              mentor: mentorship.mentorName,
              days: mentorship.daysPerWeek,
            })}
          </p>
          <p className="mt-1 text-xs text-[#858c96]">
            {day(mentorship.startDate)} – {day(mentorship.endDate)}
          </p>
        </div>
        <span className="shrink-0 text-[13px] font-medium text-[var(--ms-accent,#e86f22)]">
          {t("openGoals")}
        </span>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-[#676e78]">
          <span>{t("progress")}</span>
          <span>{t("percent", { value: mentorship.progressPercent })}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#eef1f4]">
          <div
            className="h-full rounded-full bg-[var(--ms-accent,#e86f22)] transition-[width]"
            style={{ width: `${Math.min(100, mentorship.progressPercent)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function StartRegularMentorshipDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const t = useTranslations("regularMentorships");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(1);
  const [error, setError] = useState("");

  const orgsQuery = useQuery({
    queryKey: ["mentorship-organizations"],
    queryFn: searchOrganizations,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = orgsQuery.data ?? [];
    if (!term) return list;
    return list.filter((org) => org.name.toLowerCase().includes(term));
  }, [orgsQuery.data, search]);

  const mutation = useMutation({
    mutationFn: startRegularMentorship,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: REGULAR_MENTORSHIPS_QUERY_KEY,
      });
      onCreated();
    },
    onError: (caught: Error) => {
      setError(caught.message || t("startFailed"));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-regular-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="start-regular-title"
          className="text-lg font-semibold text-[#22262b]"
        >
          {t("start")}
        </h2>
        <p className="mt-1 text-sm text-[#676e78]">{t("startHint")}</p>

        <label className="mt-5 block text-xs font-medium text-[#515861]">
          {t("searchStartup")}
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm"
            placeholder={t("startupPlaceholder")}
          />
        </label>

        <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-[#e4e7ea]">
          {orgsQuery.isLoading ? (
            <p className="p-3 text-sm text-[#676e78]">{t("loading")}</p>
          ) : filtered.length === 0 ? (
            <p className="p-3 text-sm text-[#676e78]">{t("noStartup")}</p>
          ) : (
            filtered.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setOrganizationId(org.id)}
                className={
                  "block w-full border-b border-[#eef1f4] px-3 py-2 text-left text-sm last:border-b-0 " +
                  (organizationId === org.id
                    ? "bg-[var(--ms-accent-faint,#fff4ec)] font-medium text-[var(--ms-accent,#e86f22)]"
                    : "text-[#22262b] hover:bg-[#f8f9fa]")
                }
              >
                {org.name}
              </button>
            ))
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-medium text-[#515861]">
            {t("startDate")}
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                const next = event.target.value;
                setStartDate(next);
                if (endDate && next && endDate < next) {
                  setEndDate("");
                }
              }}
              className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block text-xs font-medium text-[#515861]">
            {t("endDate")}
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block text-xs font-medium text-[#515861]">
            {t("daysPerWeek")}
            <input
              type="number"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(event) =>
                setDaysPerWeek(
                  Math.min(7, Math.max(1, Number(event.target.value) || 1)),
                )
              }
              className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-3 py-2 text-sm"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e4e7ea] px-4 py-2 text-sm text-[#515861]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={
              mutation.isPending || !organizationId || !startDate || !endDate
            }
            onClick={() => {
              if (endDate < startDate) {
                setError(t("endBeforeStart"));
                return;
              }
              setError("");
              mutation.mutate({
                organizationId,
                startDate,
                endDate,
                daysPerWeek,
              });
            }}
            className="rounded-lg bg-[var(--ms-accent,#e86f22)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {mutation.isPending ? t("saving") : t("startAction")}
          </button>
        </div>
      </div>
    </div>
  );
}
