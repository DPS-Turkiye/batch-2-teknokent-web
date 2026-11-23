// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

/** Formatted text with links (pasted or typed addresses become links). `html` is only the starting text. */
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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: { levels: [2, 3] },
        horizontalRule: false,
        strike: false,
        link: {
          openOnClick: false,
          defaultProtocol: "https",
          protocols: ["https", "mailto"],
        },
      }),
    ],
    content: html,
    editable: !disabled,
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
  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
    }),
  });
  const tools = [
    {
      label: t("bold"),
      isOn: active?.bold ?? false,
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
      isOn: active?.italic ?? false,
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
      isOn: active?.bulletList ?? false,
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
      isOn: active?.orderedList ?? false,
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
    <div className="overflow-hidden rounded-2xl border border-[#e9ecef] bg-white focus-within:border-[#22262b] focus-within:ring-2 focus-within:ring-[#22262b]">
      <div
        role="group"
        aria-label={t("toolbar")}
        className="flex gap-1 border-b border-[#eef0f2] p-2"
      >
        {tools.map(({ label, icon: Icon, isOn, run }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={isOn}
            onClick={run}
            className="grid size-9 place-items-center rounded-full text-[#676e78] hover:bg-[#f4f5f7] aria-pressed:bg-[#f4f5f7] aria-pressed:text-[#22262b]"
          >
            <Icon aria-hidden className="size-4" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
