/** The "Profili gör" page; admins and coordinators each keep their own frame. */
export function personProfileHref(userId: string, admin: boolean) {
  const id = encodeURIComponent(userId);
  return admin ? `/admin/users/${id}` : `/coordinator/people/${id}`;
}
