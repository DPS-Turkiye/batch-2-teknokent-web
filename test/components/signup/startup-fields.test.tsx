import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";

import { StartupFields } from "@/components/signup/steps/startup-fields";
import {
  emptySignupDraft,
  useStartupDraftEditors,
} from "@/hooks/use-startup-draft";
import { renderWithQueryClient } from "@test/test-utils";

function Form() {
  const [draft, setDraft] = useState(() => {
    const value = emptySignupDraft();
    value.startup.name = "Döngü";
    return value;
  });
  const editors = useStartupDraftEditors(setDraft);
  return (
    <StartupFields
      form={{ ...editors, draft, supportAreaLimitReached: false }}
    />
  );
}
it("edits the shared startup fields without requiring the signup wizard", async () => {
  renderWithQueryClient(<Form />);
  const name = screen.getByDisplayValue("Döngü");
  await userEvent.clear(name);
  await userEvent.type(name, "Yeni startup");
  expect(screen.getByDisplayValue("Yeni startup")).toBeInTheDocument();
});
