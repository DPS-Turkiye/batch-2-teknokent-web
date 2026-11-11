"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import {
  MobileEmptyState,
  MobileErrorState,
  MobileListSkeleton,
} from "@/components/mobile/mobile-states";
import { MobileTopBar } from "@/components/mobile/mobile-top-bar";
import { useMobileNotifications } from "@/hooks/use-mobile-notifications";
import { notificationAge, notificationTone } from "@/lib/mobile-notifications";
import type { DashboardNotification } from "@/types/landing";

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: DashboardNotification;
  onOpen: () => void;
}) {
  const t = useTranslations("mobile");
  const locale = useLocale();
  const unread = !notification.readAt;
  const tone = notificationTone(notification.category);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full items-start gap-3 rounded-[20px] p-3.5 text-left ${
          unread ? "bg-[#fafafb]" : ""
        }`}
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] ${tone.background}`}
        >
          <Image src={tone.icon} alt="" width={20} height={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35]">
          <span
            className={`text-[14.5px] text-[#22262b] ${
              unread ? "font-semibold" : "font-medium"
            }`}
          >
            {notification.title}
          </span>
          <span className="text-[13px] text-[#676e78]">
            {notification.body}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2 leading-[1.35]">
          <span className="text-xs text-[#858c96]">
            {notificationAge(notification.createdAt, { t, locale })}
          </span>
          {unread ? (
            <span
              className="size-2 rounded-full bg-[var(--mobile-accent)]"
              aria-label={t("notifications.unread")}
            />
          ) : null}
        </span>
      </button>
    </li>
  );
}

export function MobileNotificationsView() {
  const t = useTranslations("mobile.notifications");
  const notifications = useMobileNotifications();

  return (
    <div className="min-h-dvh bg-white">
      <MobileTopBar
        title={t("title")}
        backHref={notifications.backHref}
        backLabel={t("backHome")}
        action={
          notifications.hasUnread ? (
            <button
              type="button"
              onClick={notifications.markAllRead}
              disabled={notifications.isMarkingAll}
              className="text-[13.5px] leading-[1.35] font-medium whitespace-nowrap text-[#676e78] disabled:opacity-50"
            >
              {t("markAllRead")}
            </button>
          ) : null
        }
      />
      <div className="flex flex-col gap-2 px-5 pt-2 pb-10">
        {notifications.isLoading ? (
          <MobileListSkeleton />
        ) : notifications.isError ? (
          <MobileErrorState title={t("loadError")} />
        ) : notifications.groups.length === 0 ? (
          <MobileEmptyState
            icon="/mobile/icon-bell.svg"
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : (
          notifications.groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="pt-3.5 pb-1.5 text-[13px] leading-[1.35] font-semibold text-[#858c96]">
                {group.label}
              </h2>
              <ul className="flex flex-col gap-2">
                {group.items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onOpen={() => notifications.open(notification)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
