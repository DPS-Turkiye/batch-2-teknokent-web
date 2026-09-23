"use client";

import { useEffect, useMemo } from "react";

/** A preview URL for a picked file, released when the file changes or the view unmounts. */
export function useObjectUrl(file: File | undefined | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url;
}
