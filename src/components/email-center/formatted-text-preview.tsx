// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/** Formatted text as it will look, without letting the browser run whatever is in it. */
export function FormattedTextPreview({
  html,
  label,
}: {
  html: string;
  label: string;
}) {
  const editor = useEditor(
    {
      extensions: [StarterKit],
      content: html,
      editable: false,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          "aria-label": label,
          role: "document",
          class:
            "text-sm leading-relaxed text-[#515861] outline-none [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5",
        },
      },
    },
    [html, label],
  );
  return <EditorContent editor={editor} />;
}
