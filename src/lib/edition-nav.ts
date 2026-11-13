import type { Edition } from "@/interfaces/edition";
import { isPathOpenIn } from "@/lib/edition";

/**
 * The menu items whose page this deployment serves. A page tree the other edition owns answers 404 here, so its
 * menu item would be a dead end.
 */
export function openNavItems<Item extends { href: string }>(
  edition: Edition,
  items: readonly Item[],
): Item[] {
  return items.filter((item) => isPathOpenIn(edition, item.href));
}
