"use client";

import { useTranslations } from "next-intl";

export function TranscribeRequestedField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const t = useTranslations("meetingFields.transcribe");
  return (
    <>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e4e7ea] p-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-4 accent-[var(--ms-accent,#e86f22)]"
        />
        <span>
          <span className="block text-sm font-semibold text-[#22262b]">
            {t("label")}
          </span>
          <span className="mt-1 block text-xs leading-5 text-[#676e78]">
            {t("hint")}
          </span>
        </span>
      </label>
      {checked ? (
        <p
          role="status"
          className="mt-2 rounded-xl bg-[var(--ms-accent-faint,#fff9f5)] px-3 py-2 text-xs leading-5 text-[var(--ms-accent-strong,#c85816)]"
        >
          {t("after")}
        </p>
      ) : null}
    </>
  );
}
