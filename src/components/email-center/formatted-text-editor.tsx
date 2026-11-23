// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { EditorContent } from "@tiptap/react";
import { Bold, Italic, Link, List, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";

import { TextLinkDialog } from "@/components/email-center/text-link-dialog";
import { useFormattedText } from "@/hooks/use-formatted-text";

const TOOL =
  "grid size-9 place-items-center rounded-full text-[#676e78] hover:bg-[#f4f5f7] focus-visible:outline-2 focus-visible:outline-[#22262b] disabled:opacity-50 aria-pressed:bg-[#f4f5f7] aria-pressed:text-[#22262b] aria-pressed:ring-1 aria-pressed:ring-[#22262b]";

/** Formatted text with links. */
export function FormattedTextEditor({
  html,
  disabled,
  onChange,
}: {
  html: string;
  disabled: boolean;
  onChange: (html: string) => void;
}) {
  const t = useTranslations("emailCenter.editor");
  const text = useFormattedText({ html, disabled, onChange });
  const tools = [
    { label: t("bold"), icon: Bold, ...text.bold },
    { label: t("italic"), icon: Italic, ...text.italic },
    { label: t("bulletList"), icon: List, ...text.bulletList },
    { label: t("orderedList"), icon: ListOrdered, ...text.orderedList },
  ];

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-[#e9ecef] bg-white focus-within:border-[#22262b] focus-within:ring-2 focus-within:ring-[#22262b]">
        <div
          role="group"
          aria-label={t("toolbar")}
          className="flex flex-wrap gap-1 border-b border-[#eef0f2] p-2"
        >
          {tools.map(({ label, icon: Icon, isOn, toggle }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              aria-pressed={isOn}
              disabled={disabled}
              onClick={toggle}
              className={TOOL}
            >
              <Icon aria-hidden className="size-4" />
            </button>
          ))}
          <button
            type="button"
            aria-label={text.isLink ? t("editLink") : t("addLink")}
            aria-haspopup="dialog"
            disabled={disabled}
            onClick={text.link.open}
            className={`${TOOL} ${text.isLink ? "bg-[#f4f5f7] text-[#22262b] ring-1 ring-[#22262b]" : ""}`}
          >
            <Link aria-hidden className="size-4" />
          </button>
        </div>
        <EditorContent editor={text.editor} />
      </div>
      <p role="status" className="text-[12.5px] text-[#8a5a0c]">
        {text.warnsOfHttp ? t("httpWarning") : null}
      </p>
      <TextLinkDialog link={text.link} />
    </div>
  );
}
