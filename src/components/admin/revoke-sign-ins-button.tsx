"use client";

import { useTranslations } from "next-intl";

import { useRevokeSignIns } from "@/hooks/use-revoke-sign-ins";

export function RevokeSignInsButton({
  user,
}: {
  user: { id: string; fullName: string };
}) {
  const t = useTranslations("adminUsers.revokeSignIns");
  const { confirming, pending, ask, cancel, confirm } = useRevokeSignIns(user);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={ask}
        className="rounded-full border border-[#f3c4b5] px-4 py-2 text-[13px] font-medium text-[#c2410c] hover:bg-[#fff1ec]"
      >
        {t("button")}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[13px] text-[#22262b]">
        {t("confirm", { name: user.fullName })}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          className="rounded-full bg-[#c2410c] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
        >
          {t("yes")}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="rounded-full px-4 py-2 text-[13px] font-medium text-[#676e78] hover:bg-[#f5f6f8]"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
