"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useDashboardNotifications } from "@/hooks/use-dashboard-notifications";

function notificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationMenu({
  showBadge = true,
  minimal = false,
  appearance = "default",
}: {
  showBadge?: boolean;
  minimal?: boolean;
  appearance?: "default" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    deleteNotification,
    error,
    isLoading,
    markRead,
    notifications,
    unreadCount,
  } = useDashboardNotifications();

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Bildirimler"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className={`relative grid place-items-center rounded-lg text-[#676e78] hover:bg-[#fff7f2] hover:text-[#e86f22] ${
          appearance === "admin"
            ? "size-9"
            : minimal
              ? "size-9"
              : "size-10 rounded-full border border-[#e4e7ea]"
        }`}
      >
        {appearance === "admin" ? (
          <Image alt="" src="/admin/nav-bell.svg" width={36} height={36} />
        ) : minimal ? (
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${unreadCount > 0 ? "bg-[#e86f22]" : "bg-[#858c96]"}`}
          />
        ) : (
          <Bell className="size-[18px]" strokeWidth={1.8} aria-hidden />
        )}
        {appearance === "admin" && unreadCount > 0 ? (
          <span className="absolute top-2 right-1 size-2 rounded-full bg-[#ff6a3d]" />
        ) : null}
        {appearance !== "admin" && !minimal && showBadge && unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full border-2 border-white bg-[#e86f22] px-0.5 text-[9px] font-bold leading-3 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <section
          role="dialog"
          aria-label="Bildirimler"
          className="fixed inset-x-3 top-20 z-50 overflow-hidden rounded-2xl border border-[#e4e7ea] bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[380px]"
        >
          <header className="flex items-center justify-between border-b border-[#eef0f2] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#22262b]">
                Bildirimler
              </h2>
              <p className="text-xs text-[#858c96]">
                {unreadCount} okunmamış bildirim
              </p>
            </div>
            <button
              type="button"
              aria-label="Bildirimleri kapat"
              onClick={() => setOpen(false)}
              className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-[#f5f6f7]"
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="max-h-[min(65vh,480px)] overflow-y-auto">
            {isLoading ? (
              <p
                role="status"
                className="px-4 py-8 text-center text-sm text-[#858c96]"
              >
                Bildirimler yükleniyor…
              </p>
            ) : error ? (
              <p
                role="alert"
                className="px-4 py-8 text-center text-sm text-[#b42318]"
              >
                Bildirimler yüklenemedi.
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#858c96]">
                Henüz bildiriminiz yok.
              </p>
            ) : (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`border-b border-[#eef0f2] p-4 last:border-0 ${notification.readAt ? "bg-white" : "bg-[#fff9f5]"}`}
                >
                  <div className="flex gap-3">
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${notification.readAt ? "bg-[#d8dce1]" : "bg-[#e86f22]"}`}
                    />
                    <div className="min-w-0 flex-1">
                      {notification.href ? (
                        <Link
                          href={notification.href}
                          onClick={() => {
                            if (!notification.readAt)
                              void markRead(notification.id);
                            setOpen(false);
                          }}
                          className="block"
                        >
                          <h3 className="text-sm font-semibold text-[#22262b]">
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-[#676e78]">
                            {notification.body}
                          </p>
                        </Link>
                      ) : (
                        <>
                          <h3 className="text-sm font-semibold text-[#22262b]">
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-[#676e78]">
                            {notification.body}
                          </p>
                        </>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <time className="text-[11px] text-[#858c96]">
                          {notificationTime(notification.createdAt)}
                        </time>
                        <span className="flex gap-1">
                          {!notification.readAt ? (
                            <button
                              type="button"
                              aria-label={`Okundu olarak işaretle: ${notification.title}`}
                              onClick={() => void markRead(notification.id)}
                              className="grid size-7 place-items-center rounded-full text-[#676e78] hover:bg-white hover:text-[#23824b]"
                            >
                              <Check className="size-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            aria-label={`Bildirimi sil: ${notification.title}`}
                            onClick={() =>
                              void deleteNotification(notification.id)
                            }
                            className="grid size-7 place-items-center rounded-full text-[#676e78] hover:bg-white hover:text-[#b42318]"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
