// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";

/** Formatted text with links (pasted or typed addresses become links). `html` is only the starting text. */
export function FormattedTextEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  const t = useTranslations("emailCenter.editor");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: { levels: [2, 3] },
        horizontalRule: false,
        strike: false,
        link: { openOnClick: false, protocols: ["https", "mailto"] },
      }),
    ],
    content: html,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": t("label"),
        role: "textbox",
        "aria-multiline": "true",
        class:
          "min-h-64 w-full px-4 py-3 text-sm leading-relaxed text-[#22262b] outline-none [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });
  const tools = [
    {
      label: t("bold"),
      icon: Bold,
      run: () =>
        editor
          ?.chain()
          .focus(null, { scrollIntoView: false })
          .toggleBold()
          .run(),
    },
    {
      label: t("italic"),
      icon: Italic,
      run: () =>
        editor
          ?.chain()
          .focus(null, { scrollIntoView: false })
          .toggleItalic()
          .run(),
    },
    {
      label: t("bulletList"),
      icon: List,
      run: () =>
        editor
          ?.chain()
          .focus(null, { scrollIntoView: false })
          .toggleBulletList()
          .run(),
    },
    {
      label: t("orderedList"),
      icon: ListOrdered,
      run: () =>
        editor
          ?.chain()
          .focus(null, { scrollIntoView: false })
          .toggleOrderedList()
          .run(),
    },
  ];

  return (
    <div className="rounded-xl border border-[#e4e7ea] bg-white">
      <div className="flex gap-1 border-b border-[#eef0f2] p-2">
        {tools.map(({ label, icon: Icon, run }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={run}
            className="rounded-md p-2 text-[#515861] hover:bg-[#f4f5f6]"
          >
            <Icon aria-hidden className="size-4" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
