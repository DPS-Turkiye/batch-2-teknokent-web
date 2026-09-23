import type { ReactNode } from "react";

import { MENTOR_ACCENT_STYLE } from "@/lib/const/mentorships";

export function MentorAccent({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) return children;
  return <div style={MENTOR_ACCENT_STYLE}>{children}</div>;
}
