import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PersonProfileView } from "@/components/profile/person-profile-view";
import { UserRole } from "@/interfaces/session";

const user = {
  id: "user-2",
  email: "sude@example.com",
  fullName: "Sudenaz Yılmaz",
  role: UserRole.Mentee,
  organizationId: "org-1",
  organizationName: "Team TNT",
  jobTitle: "CTO",
};

describe("PersonProfileView", () => {
  it("shows a teammate's profile without anything editable", () => {
    render(
      <PersonProfileView
        user={user}
        profile={{
          id: "user-2",
          fullName: "Sudenaz Yılmaz",
          email: "sude@example.com",
          jobTitle: "CTO",
          phone: null,
          bio: "Ürün ve altyapı.",
          linkedinUrl: "https://linkedin.com/in/sude",
          expertise: ["Backend"],
        }}
        startupHref="/organizations/org-1"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Sudenaz Yılmaz" }),
    ).toBeInTheDocument();
    expect(screen.getByText("CTO · Team TNT")).toBeInTheDocument();
    expect(screen.getByText("Ürün ve altyapı.")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Startup profiline git →" }),
    ).toHaveAttribute("href", "/organizations/org-1");
    expect(screen.getByRole("link", { name: "sude@example.com" })).toHaveAttribute(
      "href",
      "mailto:sude@example.com",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("hides the startup link when the viewer cannot open that startup", () => {
    render(
      <PersonProfileView user={user} profile={null} startupHref={null} />,
    );

    expect(screen.getByText("Team TNT")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Startup profiline git →" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Henüz hakkında bilgisi eklenmedi."),
    ).toBeInTheDocument();
  });
});
