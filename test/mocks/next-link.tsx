import type { AnchorHTMLAttributes } from "react";

/** Marks the anchors next/link renders, so a test can tell them from plain page loads. */
export default function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a data-next-link="" {...props} />;
}
