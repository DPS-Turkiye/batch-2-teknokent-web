"use client";

import { useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useTextLink } from "@/hooks/use-text-link";
import { hasHttpAddress, hasHttpLink, isEmailLink } from "@/lib/email-link";

const STAY = { scrollIntoView: false };

/** The editor of a mail's text: what may be in it, its tools and what the writer has to be warned about. */
export function useFormattedText({
  html,
  disabled,
  onChange,
}: {
  /** What the editor starts with; afterwards the text as `onChange` last reported it. */
  html: string;
  disabled: boolean;
  onChange: (html: string) => void;
}) {
  const t = useTranslations("emailCenter.editor");
  const [droppedLink, setDroppedLink] = useState(false);
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
          protocols: ["https"],
          isAllowedUri: isEmailLink,
          shouldAutoLink: isEmailLink,
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
      transformPastedHTML: (pasted) => {
        if (hasHttpLink(pasted)) setDroppedLink(true);
        return pasted;
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });
  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
      link: current?.isActive("link") ?? false,
    }),
  });
  const link = useTextLink(editor, () => {
    setDroppedLink(false);
  });

  return {
    editor,
    link,
    isLink: state?.link ?? false,
    warnsOfHttp: hasHttpAddress(html) || droppedLink,
    bold: {
      isOn: state?.bold ?? false,
      toggle: () => editor?.chain().focus(null, STAY).toggleBold().run(),
    },
    italic: {
      isOn: state?.italic ?? false,
      toggle: () => editor?.chain().focus(null, STAY).toggleItalic().run(),
    },
    bulletList: {
      isOn: state?.bulletList ?? false,
      toggle: () => editor?.chain().focus(null, STAY).toggleBulletList().run(),
    },
    orderedList: {
      isOn: state?.orderedList ?? false,
      toggle: () => editor?.chain().focus(null, STAY).toggleOrderedList().run(),
    },
  };
}
