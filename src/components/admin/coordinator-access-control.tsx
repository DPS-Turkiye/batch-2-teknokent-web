"use client";

import { useCoordinatorAccess } from "@/hooks/use-admin-coordinators";
import { UserAccountStatus } from "@/interfaces/session";

/** Deactivating keeps the account and its programs; it only stops the person signing in. */
export function CoordinatorAccessControl({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const access = useCoordinatorAccess();
  if (status === UserAccountStatus.Pending) return null;
  const active = status === UserAccountStatus.Approved;
  return (
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
      {active ? "Pasife al" : "Yeniden etkinleştir"}
    </button>
  );
}
