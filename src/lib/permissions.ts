import { UserRole } from "@/interfaces/session";

type PermissionHolder = { role: UserRole; permissions?: readonly UserRole[] };

/** The holder's active permissions; an older cookie or response without the list holds just its role. */
export function permissionsOf(holder: PermissionHolder): UserRole[] {
  const held = new Set<UserRole>(holder.permissions ?? []);
  held.add(holder.role);
  return Object.values(UserRole).filter((permission) => held.has(permission));
}

export function hasPermission(
  holder: PermissionHolder | null | undefined,
  permission: UserRole,
): boolean {
  return holder != null && permissionsOf(holder).includes(permission);
}

export function hasAnyPermission(
  holder: PermissionHolder | null | undefined,
  permissions: readonly UserRole[],
): boolean {
  return permissions.some((permission) => hasPermission(holder, permission));
}

export function samePermissions(a: PermissionHolder, b: PermissionHolder) {
  return permissionsOf(a).join() === permissionsOf(b).join();
}
