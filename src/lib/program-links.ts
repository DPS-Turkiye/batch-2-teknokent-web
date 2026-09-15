export function programDetailHref(programId: string) {
  return `/programs/${encodeURIComponent(programId)}`;
}

export function programPersonHref(options: {
  userId: string;
  isMentor?: boolean;
}) {
  if (options.isMentor) {
    return `/mentors/${encodeURIComponent(options.userId)}`;
  }
  return `/people/${encodeURIComponent(options.userId)}`;
}

export function organizationStartupHref(organizationId: string) {
  return `/organizations/${encodeURIComponent(organizationId)}`;
}
