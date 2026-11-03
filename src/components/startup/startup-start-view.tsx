"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  startupPrimaryActionClass,
  startupSecondaryActionClass,
} from "@/components/startup/startup-page-frame";
import { StartupProfileView } from "@/components/startup/startup-profile-view";
import { useViewerIsFounder } from "@/hooks/use-organization-members";
import { useStartupAccess } from "@/hooks/use-startup-access";
import {
  useJoinStartup,
  useResubmitStartup,
} from "@/hooks/use-startup-membership";
import { StartupAccess } from "@/lib/startup-access";

const cardClass =
  "flex flex-col gap-3 rounded-[24px] border border-[#e4e7ea] bg-white px-[22px] py-5";

/** Startup'ım: the two ways in for someone without a startup, otherwise the profile. */
export function StartupHome() {
  const { access, isLoading } = useStartupAccess();
  if (isLoading) return null;
  return access === StartupAccess.None ? (
    <StartupStartView />
  ) : (
    <StartupProfileView />
  );
}

export function StartupStartView() {
  const t = useTranslations("startupStart");
  const join = useJoinStartup();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-[42px] text-[#22262b]">
          {t("title")}
        </h1>
        <p className="text-[13px] leading-5 text-[#676e78]">{t("subtitle")}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="startup-join" className={cardClass}>
          <h2
            id="startup-join"
            className="text-[15px] font-semibold leading-[23px] text-[#22262b]"
          >
            {t("joinTitle")}
          </h2>
          <p className="text-[12.5px] leading-[19px] text-[#676e78]">
            {t("joinBody")}
          </p>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (join.canJoin) join.submit();
            }}
          >
            <label htmlFor="startup-join-code" className="sr-only">
              {t("codeLabel")}
            </label>
            <input
              id="startup-join-code"
              value={join.code}
              onChange={(event) => join.setCode(event.target.value)}
              placeholder={t("codePlaceholder")}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[13px] outline-none focus:border-[#e86f22]"
            />
            <button
              type="submit"
              disabled={!join.canJoin}
              className={startupPrimaryActionClass}
            >
              {join.joining ? t("joining") : t("join")}
            </button>
          </form>
          {join.error ? (
            <p role="alert" className="text-xs text-[#b42318]">
              {join.error}
            </p>
          ) : null}
        </section>
        <section aria-labelledby="startup-create" className={cardClass}>
          <h2
            id="startup-create"
            className="text-[15px] font-semibold leading-[23px] text-[#22262b]"
          >
            {t("createTitle")}
          </h2>
          <p className="text-[12.5px] leading-[19px] text-[#676e78]">
            {t("createBody")}
          </p>
          <Link
            href="/startup/create"
            className={`${startupSecondaryActionClass} self-start`}
          >
            {t("create")}
          </Link>
        </section>
      </div>
    </div>
  );
}

/** Shown on the startup's own pages while it waits for, or after, the coordinator's decision. */
export function StartupApprovalBanner() {
  const t = useTranslations("startupStart");
  const { access } = useStartupAccess();
  const resubmit = useResubmitStartup();
  const founder = useViewerIsFounder();
  if (access !== StartupAccess.Pending && access !== StartupAccess.Rejected) {
    return null;
  }
  const rejected = access === StartupAccess.Rejected;
  // Only the founder can edit the profile and send it again; members just wait.
  const message = rejected
    ? t(founder ? "rejectedBanner" : "rejectedBannerMember")
    : t(founder ? "pendingBanner" : "pendingBannerMember");
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-[13px] leading-5 ${
        rejected
          ? "border-[#f5c2c0] bg-[#fdf2f1] text-[#912018]"
          : "border-[#f6c9a5] bg-[#fff4ec] text-[#9e4400]"
      }`}
    >
      <span>{message}</span>
      {rejected && founder ? (
        <button
          type="button"
          onClick={resubmit.resubmit}
          disabled={resubmit.resubmitting}
          className={startupPrimaryActionClass}
        >
          {t("resubmit")}
        </button>
      ) : null}
      {resubmit.error ? (
        <p role="alert" className="w-full text-xs">
          {resubmit.error}
        </p>
      ) : null}
    </div>
  );
}
