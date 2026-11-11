import { screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { ProgramContext } from "@/components/common/program-context";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

it("names the program supplied by the relationship", () => {
  renderWithQueryClient(<ProgramContext name="METU Stars" />);
  expect(screen.getByText("METU Stars")).toBeInTheDocument();
});
it("handles older records without inventing a program", () => {
  renderWithQueryClient(
    <InLocale locale="en">
      <ProgramContext />
    </InLocale>,
  );
  expect(screen.getByText("Program not specified")).toBeInTheDocument();
});
