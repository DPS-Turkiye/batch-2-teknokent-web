"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";

import { emailLink } from "@/lib/email-link";
import type { EmailLinkProblem } from "@/types/email-center";

type LinkForm = {
  address: string;
  words: string;
  /** Nothing is selected and no link is under the cursor, so the link needs words of its own. */
  needsWords: boolean;
  isEditing: boolean;
  problem: EmailLinkProblem | null;
};

/** Adding, changing and removing the link at the editor's selection, which stays put while the dialog is open. */
export function useTextLink(editor: Editor | null, onSaved: () => void) {
  const [form, setForm] = useState<LinkForm | null>(null);

  const open = () => {
    if (!editor) return;
    const isEditing = editor.isActive("link");
    const href: unknown = editor.getAttributes("link").href;
    setForm({
      address: typeof href === "string" ? href : "",
      words: "",
      needsWords: !isEditing && editor.state.selection.empty,
      isEditing,
      problem: null,
    });
  };

  const save = () => {
    if (!editor || !form) return;
    const { href, problem } = emailLink(form.address);
    if (href === null) {
      setForm({ ...form, problem });
      return;
    }
    if (form.needsWords) {
      editor
        .chain()
        .insertContent([
          {
            type: "text",
            text: form.words.trim() || form.address.trim(),
            marks: [{ type: "link", attrs: { href } }],
          },
          // Typing goes on after the link, not in it.
          { type: "text", text: " " },
        ])
        .run();
    } else {
      editor.chain().extendMarkRange("link").setLink({ href }).run();
    }
    onSaved();
    setForm(null);
  };

  return {
    form,
    open,
    close: () => {
      setForm(null);
    },
    changeAddress: (address: string) => {
      setForm(
        (previous) => previous && { ...previous, address, problem: null },
      );
    },
    changeWords: (words: string) => {
      setForm((previous) => previous && { ...previous, words });
    },
    save,
    remove: () => {
      editor?.chain().extendMarkRange("link").unsetLink().run();
      setForm(null);
    },
  };
}
