import type { Metadata } from "next";

import { LoginFlow } from "@/components/login-flow";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Görev seçimi ve platform giriş akışı.",
};

export default function LoginPage() {
  return <LoginFlow />;
}
