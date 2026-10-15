"use client";

import { useTranslations } from "next-intl";

import { MobileListSkeleton } from "@/components/mobile/mobile-states";
import { MobileToggle } from "@/components/mobile/mobile-toggle";
import { MobileTopBar } from "@/components/mobile/mobile-top-bar";
import { useMobileAccount } from "@/hooks/use-mobile-account";
import { PushDeviceState } from "@/hooks/use-push-device";

const CARD_CLASS = "w-full rounded-[24px] bg-white";

function PushDeviceRow({
  push,
}: {
  push: ReturnType<typeof useMobileAccount>["push"];
}) {
  const t = useTranslations("mobile.account");
  return (
    <div className="flex items-center gap-3 px-[18px] py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.35]">
        <p className="text-[15px] font-medium text-[#22262b]">
          {t("pushTitle")}
        </p>
        <p className="text-[12.5px] text-[#858c96]">
          {push.failed ? t("pushFailed") : t(`push.${push.state}`)}
        </p>
      </div>
      {push.state === PushDeviceState.Off ? (
        <button
          type="button"
          onClick={() => void push.enable()}
          disabled={push.isEnabling}
          className="shrink-0 rounded-full bg-[var(--mobile-accent)] px-4 py-2.5 text-[13.5px] leading-[1.35] font-semibold text-white disabled:opacity-50"
        >
          {t("pushEnable")}
        </button>
      ) : null}
    </div>
  );
}

export function MobileAccountView() {
  const t = useTranslations("mobile.account");
  const tPreferences = useTranslations("accountDialogs.preferences");
  const account = useMobileAccount();

  return (
    <div className="min-h-dvh bg-[#fbfbfc]">
      <MobileTopBar
        title={t("title")}
        backHref={account.backHref}
        backLabel={t("backHome")}
        tone="white"
      />
      <div className="flex flex-col gap-6 px-5 pt-2 pb-10">
        <section className="flex flex-col items-center gap-2.5 text-center leading-[1.35]">
          <span
            className={`flex size-20 items-center justify-center rounded-[26px] text-[29px] font-semibold ${account.avatarClass}`}
          >
            {account.initials}
          </span>
          <p className="text-xl font-semibold text-[#22262b]">
            {account.fullName}
          </p>
          <p className="text-sm text-[#676e78]">{account.email}</p>
          {account.chip ? (
            <span
              className={`rounded-full px-2.5 py-[5px] text-xs font-medium ${account.avatarClass}`}
            >
              {account.chip}
            </span>
          ) : null}
        </section>

        <section
          className="flex flex-col gap-2"
          aria-label={t("notifications")}
        >
          <h2 className="text-[13px] leading-[1.35] font-semibold text-[#858c96]">
            {t("notificationsCaps")}
          </h2>
          <div className={`${CARD_CLASS} py-1`}>
            <PushDeviceRow push={account.push} />
          </div>
          {account.preferencesLoading ? (
            <MobileListSkeleton label={t("preferencesLoading")} />
          ) : account.preferences ? (
            <ul className={`${CARD_CLASS} divide-y divide-[#f0f2f4] py-1`}>
              {account.rows.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center gap-3 px-[18px] py-3.5"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.35]">
                    <p className="text-[15px] font-medium text-[#22262b]">
                      {tPreferences(`${row.key}.label`)}
                    </p>
                    {tPreferences(`${row.key}.hint`) ? (
                      <p className="text-[12.5px] text-[#858c96]">
                        {tPreferences(`${row.key}.hint`)}
                      </p>
                    ) : null}
                  </div>
                  <MobileToggle
                    label={tPreferences(`${row.key}.label`)}
                    checked={account.preferences?.[row.key] ?? false}
                    onChange={() => account.toggle(row.key)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-[1.35] text-[#d9464b]">
              {t("preferencesFailed")}
            </p>
          )}
          {account.saveFailed ? (
            <p
              role="alert"
              className="text-[12.5px] leading-[1.35] text-[#d9464b]"
            >
              {t("saveFailed")}
            </p>
          ) : null}
        </section>

        <section
          className={`${CARD_CLASS} flex items-center gap-3 px-[18px] py-4`}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35]">
            <p className="text-[15px] font-medium text-[#22262b]">
              {account.webEdit.title}
            </p>
            <p className="text-[12.5px] text-[#858c96]">
              {account.webEdit.hint}
            </p>
          </div>
          <a
            href={account.webEdit.href}
            className="shrink-0 rounded-full border border-[#e9ecef] bg-white px-4 py-2.5 text-[13.5px] leading-[1.35] font-semibold text-[#22262b]"
          >
            {t("openOnWeb")}
          </a>
        </section>

        <button
          type="button"
          onClick={() => void account.signOut()}
          disabled={account.isSigningOut}
          className={`${CARD_CLASS} px-[18px] py-4 text-[15px] leading-[1.35] font-semibold text-[#d9464b] disabled:opacity-50`}
        >
          {account.isSigningOut ? t("signingOut") : t("signOut")}
        </button>
      </div>
    </div>
  );
}
