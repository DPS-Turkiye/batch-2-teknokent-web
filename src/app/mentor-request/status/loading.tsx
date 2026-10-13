import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#777]">
      {t("loading")}
    </div>
  );
}
