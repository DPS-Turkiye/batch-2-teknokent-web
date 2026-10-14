"use client";

import { useTranslations } from "next-intl";

import {
  useCoordinatorAccess,
  useCoordinatorPasswordSetup,
} from "@/hooks/use-admin-coordinators";
import { UserAccountStatus } from "@/interfaces/session";

/** Deactivating keeps the account and its programs; it only stops the person signing in. */
export function CoordinatorAccessControl({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const t = useTranslations("adminCoordinators");
  const access = useCoordinatorAccess();
  const setup = useCoordinatorPasswordSetup();
  if (status === UserAccountStatus.Pending) return null;
  const active = status === UserAccountStatus.Approved;
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={access.busy}
        onClick={() => access.setAccess(id, !active)}
        className={`rounded-full px-4 py-2 text-[13px] font-medium disabled:opacity-60 ${
          active
            ? "border border-[#f5c9ca] bg-white text-[#d9464b]"
            : "bg-[#22262b] text-white"
        }`}
      >
        {active ? t("deactivate") : t("reactivate")}
      </button>
      {active ? (
        <button
          type="button"
          disabled={setup.busy}
          onClick={() => setup.resend(id)}
          className="rounded-full border border-[#e9ecef] bg-white px-4 py-2 text-[13px] font-medium text-[#22262b] disabled:opacity-60"
        >
          {t("resendSetup")}
        </button>
      ) : null}
    </div>
  );
}
