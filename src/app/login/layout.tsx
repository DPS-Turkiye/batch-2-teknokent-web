import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Role selection and platform login flow.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
