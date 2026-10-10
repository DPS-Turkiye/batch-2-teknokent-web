"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { ToggleSwitch } from "@/components/common/toggle-switch";
import { useAppSession } from "@/components/providers/session-provider";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { usePasswordReset } from "@/hooks/use-password-reset";
import { roleWorkspace } from "@/lib/role-workspace";

/** The account-menu items that open a dialog instead of a page. */
export enum AccountDialog {
  Settings = "settings",
  Notifications = "notifications",
}

const PANEL_CLASS =
  "w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl outline-none";

function DialogFrame({
  id,
  title,
  onClose,
  children,
}: {
  id: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <ModalDialog labelledBy={id} onClose={onClose} panelClassName={PANEL_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="rounded-md px-2 text-lg leading-none text-[#858c96] hover:text-[#22262b]"
        >
          ×
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </ModalDialog>
  );
}

export function AccountSettingsDialog({ onClose }: { onClose: () => void }) {
  const session = useAppSession();
  const { isSendingReset, sendPasswordReset } = usePasswordReset();
  const { personalInfoHref } = roleWorkspace(session?.role);

  return (
    <DialogFrame
      id="account-settings-title"
      title="Hesap ayarları"
      onClose={onClose}
    >
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-xs text-[#858c96]">E-posta</dt>
          <dd className="mt-0.5 break-all font-medium">
            {session?.email ?? ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#858c96]">Şifre</dt>
          <dd className="mt-1.5">
            <button
              type="button"
              onClick={() => void sendPasswordReset()}
              disabled={isSendingReset}
              className="rounded-lg border border-[#d6dade] px-3 py-1.5 text-xs font-semibold text-[#515861] disabled:opacity-60"
            >
              {isSendingReset ? "Gönderiliyor…" : "Şifremi sıfırla"}
            </button>
            <p className="mt-1.5 text-xs text-[#858c96]">
              Sıfırlama bağlantısı bu adrese gönderilir.
            </p>
          </dd>
        </div>
      </dl>
      {personalInfoHref ? (
        <Link
          href={personalInfoHref}
          onClick={onClose}
          className="mt-5 inline-block text-sm font-semibold text-[#1583d6] hover:underline"
        >
          Kişisel bilgileri düzenle →
        </Link>
      ) : null}
    </DialogFrame>
  );
}

export function NotificationPreferencesDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const notifications = useNotificationPreferences();

  return (
    <DialogFrame
      id="notification-preferences-title"
      title="Bildirim tercihleri"
      onClose={onClose}
    >
      {notifications.preferencesLoading ? (
        <p className="text-sm text-[#858c96]">Bildirim ayarları yükleniyor…</p>
      ) : notifications.preferences ? (
        <ul className="divide-y divide-[#f0f2f4]">
          {notifications.rows.map((row) => (
            <li key={row.key} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{row.label}</p>
                {row.hint ? (
                  <p className="text-xs text-[#858c96]">{row.hint}</p>
                ) : null}
              </div>
              <ToggleSwitch
                label={row.label}
                checked={notifications.preferences?.[row.key] ?? false}
                onChange={() => notifications.toggle(row.key)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#d9464b]">Bildirim ayarları yüklenemedi.</p>
      )}
      {notifications.saveFailed ? (
        <p role="alert" className="mt-2 text-xs text-[#d9464b]">
          Ayar kaydedilemedi. Tekrar dene.
        </p>
      ) : null}
    </DialogFrame>
  );
}
