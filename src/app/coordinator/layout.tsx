import { CoordinatorFrame } from "@/components/coordinator/coordinator-frame";

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoordinatorFrame>{children}</CoordinatorFrame>;
}
