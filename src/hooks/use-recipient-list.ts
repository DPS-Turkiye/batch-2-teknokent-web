"use client";

import { useState } from "react";

import { useClientPagination } from "@/hooks/use-client-pagination";
import type { EmailRecipient } from "@/interfaces/email-center";
import { findRecipients } from "@/lib/email-center";
import { RecipientFilter } from "@/types/email-center";

const PAGE_SIZE = 25;

/** Looking through a mail's people; what is found changes nothing about who gets it. */
export function useRecipientList(recipients: EmailRecipient[]) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(RecipientFilter.All);
  const found = findRecipients(recipients, search, filter);
  const pages = useClientPagination(found, PAGE_SIZE);
  return {
    search,
    setSearch: (value: string) => {
      setSearch(value);
      pages.setPage(1);
    },
    filter,
    setFilter: (value: RecipientFilter) => {
      setFilter(value);
      pages.setPage(1);
    },
    rows: pages.pageItems,
    isEmpty: recipients.length === 0,
    isSearching: search.trim() !== "" || filter !== RecipientFilter.All,
    foundCount: found.length,
    page: pages.page,
    totalPages: pages.totalPages,
    setPage: pages.setPage,
  };
}
