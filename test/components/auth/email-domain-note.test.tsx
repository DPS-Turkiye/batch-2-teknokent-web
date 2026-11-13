import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmailDomainNote } from "@/components/auth/email-domain-note";

describe("EmailDomainNote", () => {
  it("renders nothing when sign-up is open to every domain", () => {
    const { container } = render(
      <EmailDomainNote domains="" notAllowed={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("names the allowed domain as a hint", () => {
    render(<EmailDomainNote domains="@metu.edu.tr" notAllowed={false} />);
    expect(
      screen.getByText(
        "Kayıt için @metu.edu.tr uzantılı e-posta adresini kullan.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("turns into an alert for an address outside the domain", () => {
    render(<EmailDomainNote domains="@metu.edu.tr" notAllowed />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bu adresle kayıt olunamaz; @metu.edu.tr uzantılı e-posta adresini kullan.",
    );
  });
});
