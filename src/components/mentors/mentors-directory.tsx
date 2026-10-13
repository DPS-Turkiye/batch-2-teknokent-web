"use client";

import Link from "next/link";
import { ChevronRight, Filter, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Avatar } from "@/components/common/avatar";
import { useMentors } from "@/hooks/use-mentors";
import type { MentorProfile } from "@/interfaces/mentor";
import {
  applyMentorDirectory,
  DEFAULT_MENTOR_FILTERS,
  mentorExpertiseLabel,
  uniqueAvailability,
  uniqueSpecialties,
  uniqueStartupStages,
  type MentorDirectoryFilters,
  type MentorSort,
} from "@/lib/mentor-directory";
import { mentorProfileHref } from "@/lib/mentor-profile-request";

const SORTS: MentorSort[] = ["best", "name"];

export function MentorsDirectory({
  embedded = false,
  error: errorProp,
  mentors: mentorsProp,
}: {
  embedded?: boolean;
  error?: string;
  mentors?: MentorProfile[];
}) {
  const t = useTranslations("mentorsDirectory");
  const shouldFetch = mentorsProp === undefined;
  const mentorsQuery = useMentors({ enabled: shouldFetch });
  const mentors = useMemo(
    () => mentorsProp ?? mentorsQuery.data ?? [],
    [mentorsProp, mentorsQuery.data],
  );
  const error =
    errorProp ??
    (mentorsQuery.error instanceof Error ? t("loadFailed") : undefined);
  const isLoading = shouldFetch && mentorsQuery.isLoading;

  const [filters, setFilters] = useState<MentorDirectoryFilters>(
    DEFAULT_MENTOR_FILTERS,
  );
  const [moreFilters, setMoreFilters] = useState(false);

  const visible = useMemo(
    () => applyMentorDirectory(mentors, filters),
    [filters, mentors],
  );
  const specialties = useMemo(() => uniqueSpecialties(mentors), [mentors]);
  const stages = useMemo(() => uniqueStartupStages(mentors), [mentors]);
  const availabilityOptions = useMemo(
    () => uniqueAvailability(mentors),
    [mentors],
  );

  function patch(next: Partial<MentorDirectoryFilters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  const panel = (
    <section className="rounded-2xl border border-[#f2b78f] bg-white">
      <div className="p-4 sm:p-5">
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-[#e4e7ea] bg-[#f8f9fa] px-4">
          <Search className="size-4 text-[#858c96]" aria-hidden />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => patch({ query: event.target.value })}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => patch({ query: "" })}
              aria-label={t("clearSearch")}
              className="grid size-7 place-items-center rounded-full text-[#858c96] hover:bg-white hover:text-[#22262b]"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Filter className="size-4 text-[#c85816]" aria-hidden />
          {filters.specialty ? (
            <FilterChip
              label={t("chip", {
                filter: t("specialty"),
                value: filters.specialty,
              })}
              onRemove={() => patch({ specialty: "" })}
            />
          ) : (
            <FilterSelect
              label={t("specialty")}
              value={filters.specialty}
              options={specialties}
              onChange={(specialty) => patch({ specialty })}
            />
          )}
          {filters.startupStage ? (
            <FilterChip
              label={t("chip", {
                filter: t("stage"),
                value: filters.startupStage,
              })}
              onRemove={() => patch({ startupStage: "" })}
            />
          ) : (
            <FilterSelect
              label={t("stage")}
              value={filters.startupStage}
              options={stages}
              onChange={(startupStage) => patch({ startupStage })}
            />
          )}
          {filters.availability ? (
            <FilterChip
              label={t("chip", {
                filter: t("availability"),
                value: filters.availability,
              })}
              onRemove={() => patch({ availability: "" })}
            />
          ) : moreFilters || filters.availability ? (
            <FilterSelect
              label={t("availability")}
              value={filters.availability}
              options={availabilityOptions}
              onChange={(availability) => patch({ availability })}
            />
          ) : (
            <button
              type="button"
              onClick={() => setMoreFilters(true)}
              className="rounded-full border border-[#f2b78f] px-3 py-1.5 text-xs font-medium text-[#c85816]"
            >
              {t("more")}
            </button>
          )}
          <label className="ml-auto flex items-center gap-2 text-xs font-medium text-[#515861]">
            {t("sortBy")}
            <select
              aria-label={t("sortLabel")}
              value={filters.sort}
              onChange={(event) =>
                patch({ sort: event.target.value as MentorSort })
              }
              className="bg-transparent font-semibold text-[#22262b] outline-none"
            >
              {SORTS.map((sort) => (
                <option key={sort} value={sort}>
                  {t(`sort.${sort}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="border-t border-[#f2b78f] px-5 py-4 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="border-t border-[#eef0f2] px-5 py-10 text-center text-sm text-[#676e78]">
          {t("loading")}
        </p>
      ) : visible.length === 0 ? (
        <p className="border-t border-[#eef0f2] px-5 py-10 text-center text-sm text-[#676e78]">
          {filters.query.trim() ||
          filters.specialty ||
          filters.startupStage ||
          filters.availability
            ? t("noMatch")
            : t("empty")}
        </p>
      ) : (
        <ul>
          {visible.map((mentor) => (
            <li key={mentor.id} className="border-t border-[#eef0f2]">
              <Link
                href={mentorProfileHref(mentor.id)}
                className="flex items-center gap-3 px-4 py-4 transition hover:bg-[#fff9f5] sm:px-5"
              >
                <Avatar initials={mentor.initials} tone="orange" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#22262b]">
                    {mentor.fullName}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-[#676e78]">
                    {mentorExpertiseLabel(mentor)}
                  </span>
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-[#c5c9ce]"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  if (embedded) return panel;

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-8 sm:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-[#e86f22]">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-[#676e78]">{t("intro")}</p>
      </div>
      {panel}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="rounded-full border border-[#e86f22] px-3 py-1.5 text-xs font-medium text-[#c85816]"
    >
      {label}
    </button>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  if (!options.length) return null;
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-full border border-[#f2b78f] bg-white px-3 py-1.5 text-xs font-medium text-[#c85816] outline-none"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
