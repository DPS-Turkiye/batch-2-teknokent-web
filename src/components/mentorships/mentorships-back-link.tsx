import Link from "next/link";

import { MENTORSHIPS_BACK_LABEL } from "@/lib/const/mentorships";

export function MentorshipsBackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex text-sm font-medium text-[var(--ms-accent,#e86f22)] hover:underline"
    >
      ← {MENTORSHIPS_BACK_LABEL}
    </Link>
  );
}
