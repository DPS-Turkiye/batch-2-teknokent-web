"use client";

import { useCallback, useState } from "react";

/** A one-line "+ ekle" input that opens in place and hands its text to onAdd. */
export function useInlineEntry(onAdd: (value: string) => void) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const cancel = useCallback(() => {
    setValue("");
    setOpen(false);
  }, []);

  const submit = useCallback(() => {
    if (!value.trim()) return;
    onAdd(value.trim());
    cancel();
  }, [cancel, onAdd, value]);

  const openEntry = useCallback(() => setOpen(true), []);

  return { open, value, setValue, openEntry, submit, cancel };
}
