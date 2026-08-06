import type { Metadata } from "next";

import { WorkspacePicker } from "@/components/workspace-picker";

export const metadata: Metadata = {
  title: "Çalışma Alanı",
  description: "Program ve görev çalışma alanı seçimi.",
};

export default function WorkspacePage() {
  return <WorkspacePicker />;
}
