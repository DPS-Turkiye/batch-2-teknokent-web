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

  // Back to the text, once the dialog has given the focus back to its button.
  const leave = () => {
    setForm(null);
    setTimeout(() => {
      if (editor && !editor.isDestroyed)
        editor.commands.focus(null, { scrollIntoView: false });
    }, 0);
  };

  const open = () => {
    if (!editor?.isEditable) return;
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

  /** `addressField` is gone to when the address cannot be used. */
  const save = (addressField: HTMLElement | null) => {
    if (!editor?.isEditable || !form) return;
    const { href, problem } = emailLink(form.address);
    if (href === null) {
      setForm({ ...form, problem });
      addressField?.focus();
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
    leave();
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
      if (!editor?.isEditable) return;
      editor.chain().extendMarkRange("link").unsetLink().run();
      leave();
    },
  };
}
