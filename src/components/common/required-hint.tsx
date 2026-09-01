export function RequiredHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-[#b42318]">
      Bu alanı doldurman zorunlu.
    </p>
  );
}
