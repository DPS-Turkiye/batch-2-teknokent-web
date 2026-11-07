"use client";

import { useTranslations } from "next-intl";

import type { MentorEducationInput } from "@/interfaces/mentor";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
/** A mentor's schools as editable rows; used at signup and on the mentor's own profile page. */
export function EducationListEditor({
  items,
  canAdd,
  onAdd,
  onChange,
  onRemove,
  inputClass,
  labelClass,
}: {
  items: readonly MentorEducationInput[];
  canAdd: boolean;
  onAdd: () => void;
  onChange: (
    index: number,
    key: keyof MentorEducationInput,
    value: string,
  ) => void;
  onRemove: (index: number) => void;
  inputClass: string;
  labelClass: string;
}) {
  const t = useTranslations("mentorEducation");
  const fields = [
    ["school", t("school"), t("schoolPlaceholder")],
    ["degree", t("degree"), t("degreePlaceholder")],
    ["period", t("period"), t("periodPlaceholder")],
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-lg border border-[#e4e7ea] p-3"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {fields.map(([key, label, placeholder]) => (
              <label key={key} className={labelClass}>
                {label}
                <input
                  className={inputClass}
                  value={item[key]}
                  maxLength={key === "period" ? 100 : 200}
                  placeholder={placeholder}
                  onChange={(event) => onChange(index, key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={t("removeNamed", {
              school: item.school || t("school"),
            })}
            className="self-end rounded-full px-3 py-1.5 text-[12px] font-medium text-[#b42318] hover:bg-[#fef3f2]"
          >
            {t("remove")}
          </button>
        </div>
      ))}
      {canAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="self-start rounded-full border border-[#d4d8dd] bg-white px-4 py-2 text-[12.5px] font-medium text-[#4a5059]"
        >
          {t("add")}
        </button>
      ) : null}
    </div>
  );
}
