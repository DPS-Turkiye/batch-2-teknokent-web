import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { InLocale } from "@test/test-utils";

describe("SampleDataNotice", () => {
  it("says the data is sample data, in both languages", () => {
    const { unmount } = render(
      <InLocale locale="tr">
        <SampleDataNotice />
      </InLocale>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Örnek veriler");
    unmount();
    render(
      <InLocale locale="en">
        <SampleDataNotice />
      </InLocale>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("sample data");
  });
});
