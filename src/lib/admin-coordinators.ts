import {
  type CoordinatorAccount,
  type CoordinatorCandidate,
  CoordinatorCandidateStatus,
} from "@/interfaces/admin-coordinator";
import { UserRole } from "@/interfaces/session";

const ASSIGNABLE = new Set([
  CoordinatorCandidateStatus.New,
  CoordinatorCandidateStatus.Promotable,
  CoordinatorCandidateStatus.Reactivatable,
]);

export function isAssignable(candidate: CoordinatorCandidate | undefined) {
  return !!candidate && ASSIGNABLE.has(candidate.status);
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: "yönetici",
  [UserRole.Coordinator]: "koordinatör",
  [UserRole.Mentor]: "mentor",
  [UserRole.Mentee]: "girişimci",
};

/** What saving will do, or why it can't, in the admin's words. */
export function candidateMessage(candidate: CoordinatorCandidate) {
  const name = candidate.fullName ?? candidate.email;
  switch (candidate.status) {
    case CoordinatorCandidateStatus.New:
      return "Bu e-posta için yeni bir koordinatör hesabı açılacak. Kişi şifresini giriş ekranındaki “Şifremi unuttum” ile belirler.";
    case CoordinatorCandidateStatus.Promotable:
      return `${name} şu an ${candidate.role ? ROLE_LABELS[candidate.role] : "kullanıcı"}. Kaydederseniz rolü koordinatör olarak değişir.`;
    case CoordinatorCandidateStatus.Reactivatable:
      return `${name} pasif bir koordinatör. Kaydederseniz yeniden etkinleşir.`;
    case CoordinatorCandidateStatus.AlreadyCoordinator:
      return `${name} zaten koordinatör.`;
    case CoordinatorCandidateStatus.Admin:
      return "Bu e-posta bir yöneticiye ait.";
    case CoordinatorCandidateStatus.TeamMember:
      return `${name} bir startup ekibinde. Takım üyeleri koordinatör yapılamaz.`;
    case CoordinatorCandidateStatus.MentorInMentorship:
      return `${name} planlı ya da aktif bir mentorluk yürütüyor. Mentorlukları bitmeden koordinatör yapılamaz.`;
  }
}

export function addedMessage(account: CoordinatorAccount) {
  switch (account.outcome) {
    case CoordinatorCandidateStatus.Promotable:
      return `${account.fullName} artık koordinatör.`;
    case CoordinatorCandidateStatus.Reactivatable:
      return `${account.fullName} yeniden etkinleştirildi.`;
    default:
      return `${account.fullName} eklendi. Giriş için “Şifremi unuttum” ile şifre belirlemesini iletin.`;
  }
}

/** A new person needs a name; an existing account keeps the one it has. */
export function nameRequired(candidate: CoordinatorCandidate | undefined) {
  return candidate?.status === CoordinatorCandidateStatus.New;
}
