import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Program and role workspace selection.",
};

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
