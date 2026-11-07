import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AccountTypeProvider,
  useAccountType,
} from "@/components/providers/account-type-provider";
import { AccountType } from "@/interfaces/account-type";

function ShowAccountType() {
  return <p>{useAccountType()}</p>;
}

describe("AccountTypeProvider", () => {
  it("hands the server's account type to client components", () => {
    render(
      <AccountTypeProvider accountType={AccountType.Odtu}>
        <ShowAccountType />
      </AccountTypeProvider>,
    );
    expect(screen.getByText("odtu")).toBeInTheDocument();
  });

  it("falls back to Teknokent outside the provider", () => {
    render(<ShowAccountType />);
    expect(screen.getByText("teknokent")).toBeInTheDocument();
  });
});
