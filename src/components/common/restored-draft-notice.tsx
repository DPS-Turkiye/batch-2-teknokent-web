"use client";

export function RestoredDraftNotice({
  droppedFiles,
}: {
  droppedFiles: number;
}) {
  if (droppedFiles < 1) return null;

  return (
    <p
      role="status"
      className="mx-auto mt-6 w-full max-w-[620px] rounded-xl bg-[#fdebdd] px-4 py-3 text-sm text-[#c85816]"
    >
      Kaldığınız yerden devam ediyorsunuz. Daha önce eklediğiniz {droppedFiles}{" "}
      dosya sayfa yenilendiği için korunamadı; lütfen tekrar yükleyin.
    </p>
  );
}
