"use client";

import { Check, Plus, ShieldCheck, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  Avatar,
  EmptyNote,
  FilterPills,
  QueryNotice,
  SearchField,
  StatusChip,
} from "@/components/admin/admin-ui";
import { PillSelect } from "@/components/coordinator/pill-select";
import { ProfileLink } from "@/components/people/profile-link";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import { useMentorPool, useMentorReview } from "@/hooks/use-mentor-pool";
import { useOptionLabel } from "@/hooks/use-option-label";
import {
  type CoordinatorProgramDetail,
  ProgramLifecycle,
} from "@/interfaces/coordinator-program";
import { type MentorPoolRow, MentorPoolStatus } from "@/interfaces/mentor-pool";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import {
  CapacityFilter,
  loadShare,
  profileMentorId,
  POOL_STATUS_TONES,
  poolRowNote,
  rowKey,
} from "@/lib/mentor-pool";
import { formatLongDate, initials } from "@/lib/utils";

export function ProgramMentorsView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.MentorPool}>
      {(detail) => <PoolBody programId={programId} detail={detail} />}
    </ProgramDetailFrame>
  );
}

type Pool = ReturnType<typeof useMentorPool>;

function PoolBody({
  programId,
  detail,
}: {
  programId: string;
  detail: CoordinatorProgramDetail;
}) {
  const t = useTranslations("programMentors");
  const optionLabel = useOptionLabel();
  const pool = useMentorPool(programId);
  const archived = detail.program.lifecycle === ProgramLifecycle.Completed;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterPills
          value={pool.filter}
          onChange={pool.setFilter}
          options={pool.filterOptions}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-[260px]">
            <SearchField
              value={pool.search}
              onChange={pool.setSearch}
              placeholder={t("search")}
            />
          </div>
          <PillSelect
            label={t("expertise")}
            value={pool.expertise}
            options={[
              { value: "", label: t("all") },
              ...pool.expertiseOptions.map((tag) => ({
                value: tag,
                label: optionLabel("mentorTopic", tag),
              })),
            ]}
            onChange={pool.setExpertise}
          />
          <PillSelect
            label={t("capacity")}
            value={pool.capacity}
            options={Object.values(CapacityFilter).map((value) => ({
              value,
              label: t(`capacityFilters.${value}`),
            }))}
            onChange={(value) => pool.setCapacity(value as CapacityFilter)}
          />
          {archived ? null : (
            <button
              type="button"
              onClick={pool.openInvite}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white"
            >
              <Plus aria-hidden className="size-4" /> {t("invite")}
            </button>
          )}
        </div>
      </div>

      <QueryNotice isLoading={pool.query.isLoading} error={pool.query.error} />
      {pool.query.isSuccess && pool.visible.length === 0 ? (
        <EmptyNote>
          {pool.rows.length === 0 ? t("empty") : t("noMatch")}
        </EmptyNote>
      ) : null}

      {pool.visible.length > 0 ? (
        <div className="overflow-x-auto rounded-[28px] border border-[#e9ecef] bg-white">
          <table className="w-full min-w-[980px] text-left text-[13.5px]">
            <thead className="text-[12.5px] text-[#858c96]">
              <tr className="border-b border-[#f0f2f4]">
                <th className="px-6 py-4 font-normal">{t("columns.mentor")}</th>
                <th className="px-4 py-4 font-normal">{t("columns.status")}</th>
                <th className="px-4 py-4 font-normal">
                  {t("columns.expertise")}
                </th>
                <th className="px-4 py-4 font-normal">
                  {t("columns.programs")}
                </th>
                <th className="px-4 py-4 font-normal">{t("columns.load")}</th>
                <th className="px-6 py-4">
                  <span className="sr-only">{t("columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pool.visible.map((row) => (
                <PoolRow
                  key={rowKey(row)}
                  row={row}
                  pool={pool}
                  archived={archived}
                />
              ))}
            </tbody>
          </table>
          <p className="border-t border-[#f0f2f4] px-6 py-4 text-[12.5px] text-[#858c96]">
            {t("showing", {
              total: pool.rows.length,
              shown: pool.visible.length,
            })}
          </p>
        </div>
      ) : null}

      {pool.inviting ? <InviteDialog pool={pool} /> : null}
      {pool.reviewing ? (
        <ReviewDialog
          programId={programId}
          mentorId={pool.reviewing}
          detail={detail}
          onClose={pool.closeReview}
          onDone={(rows) => {
            pool.saved(rows);
            pool.closeReview();
          }}
        />
      ) : null}
    </div>
  );
}

function PoolRow({
  row,
  pool,
  archived,
}: {
  row: MentorPoolRow;
  pool: Pool;
  archived: boolean;
}) {
  const t = useTranslations("programMentors");
  const optionLabel = useOptionLabel();
  const note = poolRowNote(row, t);
  const name = row.fullName ?? row.email;
  const hasLoad =
    row.status === MentorPoolStatus.Active ||
    row.status === MentorPoolStatus.Full;
  const profileId = profileMentorId(row);
  return (
    <tr className="border-b border-[#f0f2f4] last:border-0">
      <td className="px-6 py-4">
        <span className="flex items-center gap-3">
          <Avatar initials={initials(name) || "?"} tone="blue" size="lg" />
          <span className="min-w-0">
            <span className="block truncate text-[#22262b]">
              {row.fullName ?? t("awaitingSignup")}
            </span>
            <span className="block truncate text-[12.5px] text-[#858c96]">
              {row.email}
            </span>
          </span>
        </span>
      </td>
      <td className="px-4 py-4">
        <StatusChip tone={POOL_STATUS_TONES[row.status]}>
          {t(`status.${row.status}`)}
        </StatusChip>
      </td>
      <td className="px-4 py-4">
        <span className="flex flex-wrap gap-1.5">
          {row.expertise.length === 0
            ? "—"
            : row.expertise.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#e9ecef] px-2.5 py-1 text-[12px] text-[#22262b]"
                >
                  {optionLabel("mentorTopic", tag)}
                </span>
              ))}
        </span>
      </td>
      <td className="px-4 py-4 text-[#22262b]">
        {row.programs.length > 0 ? row.programs.join(", ") : "—"}
      </td>
      <td className="px-4 py-4">
        {hasLoad ? (
          <span className="flex items-center gap-3 text-[12.5px] text-[#676e78]">
            <span className="h-1.5 w-[90px] overflow-hidden rounded-full bg-[#f0f2f4]">
              <span
                className={`block h-full rounded-full ${
                  row.status === MentorPoolStatus.Full
                    ? "bg-[#ffa94d]"
                    : "bg-[#26a4ff]"
                }`}
                style={{ width: `${loadShare(row)}%` }}
              />
            </span>
            {t("load", { active: row.activeTeams, capacity: row.capacity })}
          </span>
        ) : (
          <span className="text-[12.5px] text-[#858c96]">{note}</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="flex justify-end gap-2">
          {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
          {profileId ? <ProfileLink userId={profileId} name={name} /> : null}
          <RowActions row={row} pool={pool} archived={archived} />
        </span>
      </td>
    </tr>
  );
}

function RowActions({
  row,
  pool,
  archived,
}: {
  row: MentorPoolRow;
  pool: Pool;
  archived: boolean;
}) {
  const t = useTranslations("programMentors");
  if (archived) return null;
  const outline =
    "rounded-full border border-[#e9ecef] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#22262b] disabled:opacity-50";
  switch (row.status) {
    case MentorPoolStatus.AwaitingApproval:
      return (
        <button
          type="button"
          onClick={() => pool.openReview(row.mentorId as string)}
          className="rounded-full bg-[#22262b] px-3.5 py-2 text-[12.5px] font-medium text-white"
        >
          {t("review")}
        </button>
      );
    case MentorPoolStatus.Invited:
    case MentorPoolStatus.InviteExpiring:
    case MentorPoolStatus.InviteExpired:
      return (
        <>
          {row.inviteId ? (
            <button
              type="button"
              disabled={pool.busy}
              onClick={() => pool.renew(row)}
              className={outline}
            >
              {t("resend")}
            </button>
          ) : null}
          <button
            type="button"
            disabled={pool.busy}
            onClick={() => pool.takeBack(row)}
            aria-label={t("takeBack", { name: row.fullName ?? row.email })}
            className="grid size-9 place-items-center rounded-full text-[#858c96] hover:bg-[#f4f5f7] disabled:opacity-50"
          >
            <X aria-hidden className="size-4" />
          </button>
        </>
      );
    default:
      return null;
  }
}

function InviteDialog({ pool }: { pool: Pool }) {
  const t = useTranslations("programMentors");
  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 grid h-dvh max-h-none w-screen max-w-none place-items-center bg-black/30 p-4"
      onClick={pool.closeInvite}
    >
      <form
        aria-label={t("invite")}
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          pool.sendInvite();
        }}
      >
        <h2 className="text-[18px] font-semibold text-[#22262b]">
          {t("invite")}
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.5] text-[#676e78]">
          {t("inviteBody")}
        </p>
        <label className="mt-5 block text-[12.5px] font-medium text-[#676e78]">
          {t("email")}
          <input
            type="email"
            value={pool.email}
            onChange={(event) => pool.setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            autoFocus
            className="mt-1.5 h-11 w-full rounded-2xl border border-[#e9ecef] px-4 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
          />
        </label>
        {pool.inviteError ? (
          <p role="alert" className="mt-2 text-[13px] text-[#d9464b]">
            {pool.inviteError}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={pool.closeInvite}
            className="rounded-full px-4 py-2.5 text-[13px] text-[#22262b]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={pool.sending}
            className="rounded-full bg-[#22262b] px-4 py-2.5 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {pool.sending ? t("sending") : t("send")}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function ReviewDialog({
  programId,
  mentorId,
  detail,
  onClose,
  onDone,
}: {
  programId: string;
  mentorId: string;
  detail: CoordinatorProgramDetail;
  onClose: () => void;
  onDone: (rows: MentorPoolRow[]) => void;
}) {
  const t = useTranslations("programMentors.reviewDialog");
  const locale = useLocale();
  const optionLabel = useOptionLabel();
  const review = useMentorReview(programId, mentorId, onDone);
  const data = review.review;
  const teams = detail.awaitingTeams.slice(0, 3).map((team) => team.name);

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 grid h-dvh max-h-none w-screen max-w-none place-items-center bg-black/30 p-4"
      onClick={onClose}
    >
      <section
        aria-label={t("label")}
        className="flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        {!data ? (
          <div className="p-6">
            <QueryNotice
              isLoading={review.query.isLoading}
              error={review.query.error}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <header className="flex items-start gap-3">
                <Avatar
                  initials={initials(data.fullName)}
                  tone="blue"
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="flex flex-wrap items-center gap-2 text-[18px] font-semibold text-[#22262b]">
                    {data.fullName}
                    <StatusChip tone="blue">{t("mentor")}</StatusChip>
                    <StatusChip tone="amber">{t("awaiting")}</StatusChip>
                  </h2>
                  <p className="mt-0.5 text-[12.5px] text-[#858c96]">
                    {data.viaInvite ? t("viaInvite") : t("joinRequest")} ·{" "}
                    {formatLongDate(data.requestedAt, locale)} · {data.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("close")}
                  className="grid size-8 place-items-center rounded-full bg-[#f4f5f7] text-[#676e78]"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </header>

              <p className="flex gap-2 rounded-2xl bg-[#fff6e5] px-4 py-3 text-[13px] text-[#6b4a12]">
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
                {t("question")}
              </p>

              <div>
                <h3 className="mb-2 text-[12px] font-medium tracking-wide text-[#858c96] uppercase">
                  {t("declared")}
                </h3>
                {data.expertise.length === 0 ? (
                  <p className="text-[13px] text-[#858c96]">
                    {t("noExpertise")}
                  </p>
                ) : (
                  <span className="flex flex-wrap gap-1.5">
                    {data.expertise.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#eaf6ff] px-2.5 py-1 text-[12px] text-[#1583d6]"
                      >
                        {optionLabel("mentorTopic", tag)}
                      </span>
                    ))}
                  </span>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-[12px] font-medium tracking-wide text-[#858c96] uppercase">
                  {t("checks")}
                </h3>
                <ul className="divide-y divide-[#f0f2f4] rounded-2xl border border-[#e9ecef]">
                  <CheckRow
                    done={data.emailVerified}
                    title={t("emailVerified")}
                    hint={data.viaInvite ? t("viaLink") : t("signedIn")}
                  />
                  <CheckRow
                    done={Boolean(data.linkedinUrl)}
                    title={t("linkedin")}
                    hint={
                      data.linkedinUrl ? (
                        <a
                          href={data.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {data.professionalTitle || t("openProfile")}
                        </a>
                      ) : (
                        t("noLinkedin")
                      )
                    }
                  />
                  <CheckRow
                    done={Boolean(data.invitedBy)}
                    title={t("reference")}
                    hint={
                      data.invitedBy
                        ? t("invitedBy", { name: data.invitedBy })
                        : t("noReference")
                    }
                  />
                  <li className="px-4 py-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={review.expertiseConfirmed}
                        onChange={(event) =>
                          review.setExpertiseConfirmed(event.target.checked)
                        }
                        className="mt-1 size-4 accent-[#2f9e6b]"
                      />
                      <span>
                        <span className="block text-[13.5px] text-[#22262b]">
                          {t("expertiseOk")}
                        </span>
                        <span className="block text-[12px] text-[#858c96]">
                          {t("yourCall")}
                        </span>
                      </span>
                    </label>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-[12px] font-medium tracking-wide text-[#858c96] uppercase">
                  {t("preferences")}
                </h3>
                <dl className="space-y-2 rounded-2xl bg-[#f7f8f9] px-4 py-3 text-[13px]">
                  <Pref
                    label={t("availability")}
                    value={data.availability ?? "—"}
                  />
                  <Pref
                    label={t("suggestedCapacity")}
                    value={t("capacityValue", { count: data.capacity })}
                  />
                  <Pref
                    label={t("waitingTeams")}
                    value={teams.length > 0 ? teams.join(", ") : "—"}
                  />
                </dl>
              </div>
            </div>

            <footer className="flex flex-wrap items-center gap-2 border-t border-[#f0f2f4] px-6 py-4">
              <button
                type="button"
                disabled={review.deciding}
                onClick={review.reject}
                className="rounded-full px-4 py-2.5 text-[13px] text-[#22262b] disabled:opacity-50"
              >
                {t("reject")}
              </button>
              {review.moreInfoHref ? (
                <a
                  href={review.moreInfoHref}
                  className="rounded-full border border-[#e9ecef] px-4 py-2.5 text-[13px] text-[#22262b]"
                >
                  {t("moreInfo")}
                </a>
              ) : null}
              <button
                type="button"
                disabled={!review.expertiseConfirmed || review.deciding}
                onClick={review.approve}
                className="ml-auto rounded-full bg-[#22262b] px-4 py-2.5 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
              >
                {t("approve")}
              </button>
            </footer>
          </>
        )}
      </section>
    </dialog>
  );
}

function CheckRow({
  done,
  title,
  hint,
}: {
  done: boolean;
  title: string;
  hint: ReactNode;
}) {
  const t = useTranslations("programMentors.reviewDialog");
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span
        aria-hidden
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md ${
          done ? "bg-[#2f9e6b] text-white" : "border border-[#e0e3e7]"
        }`}
      >
        {done ? <Check className="size-3.5" /> : null}
      </span>
      <span>
        <span className="block text-[13.5px] text-[#22262b]">
          {title}
          <span className="sr-only">{done ? t("done") : t("missing")}</span>
        </span>
        <span className="block text-[12px] text-[#858c96]">{hint}</span>
      </span>
    </li>
  );
}

function Pref({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#676e78]">{label}</dt>
      <dd className="text-right text-[#22262b]">{value}</dd>
    </div>
  );
}
