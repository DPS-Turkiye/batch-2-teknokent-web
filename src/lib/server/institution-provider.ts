import "server-only";

import { InstitutionProvider } from "@/interfaces/institution-login";

export function toInstitutionProvider(
  value: string,
): InstitutionProvider | null {
  return (Object.values(InstitutionProvider) as string[]).includes(value)
    ? (value as InstitutionProvider)
    : null;
}
