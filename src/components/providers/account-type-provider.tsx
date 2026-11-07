"use client";

import { createContext, ReactNode, useContext } from "react";

import { AccountType } from "@/interfaces/account-type";

const AccountTypeContext = createContext<AccountType>(AccountType.Teknokent);

/** Hands the account type the server resolved for this request to client components. */
export function AccountTypeProvider({
  accountType,
  children,
}: {
  accountType: AccountType;
  children: ReactNode;
}) {
  return (
    <AccountTypeContext.Provider value={accountType}>
      {children}
    </AccountTypeContext.Provider>
  );
}

export function useAccountType(): AccountType {
  return useContext(AccountTypeContext);
}
