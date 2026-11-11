import { useTranslations } from "next-intl";
import Image from "next/image";

const CARD_CLASS =
  "flex w-full flex-col gap-3 rounded-[24px] border border-[#e9ecef] bg-white p-5";

const SKELETON_OPACITY = ["", "opacity-75", "opacity-50"];

export function MobileListSkeleton({ label }: { label?: string }) {
  const t = useTranslations("mobile.states");
  return (
    <div
      className={CARD_CLASS}
      role="status"
      aria-label={label ?? t("loading")}
    >
      {SKELETON_OPACITY.map((opacity) => (
        <div
          key={opacity || "full"}
          className={`flex items-center gap-3.5 ${opacity}`}
        >
          <Image
            src="/mobile/skeleton-avatar.svg"
            alt=""
            width={44}
            height={44}
          />
          <div className="flex flex-col gap-2">
            <span className="h-3 w-[180px] rounded-full bg-[#f0f2f4]" />
            <span className="h-2.5 w-[120px] rounded-full bg-[#f5f6f8]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MobileEmptyState({
  icon = "/mobile/icon-calendar-lg.svg",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description: string;
}) {
  return (
    <div className={`${CARD_CLASS} items-center text-center`}>
      <span className="flex size-[52px] items-center justify-center rounded-[20px] bg-[#f5f6f8]">
        <Image src={icon} alt="" width={24} height={24} />
      </span>
      <p className="text-[15px] leading-[1.35] font-semibold text-[#22262b]">
        {title}
      </p>
      <p className="text-[13.5px] leading-[1.35] text-[#676e78]">
        {description}
      </p>
    </div>
  );
}

export function MobileErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations("mobile.states");
  return (
    <div className={`${CARD_CLASS} items-center text-center`} role="alert">
      <span className="flex size-[52px] items-center justify-center rounded-[20px] bg-[#fdeeee]">
        <Image
          src="/mobile/icon-info-danger.svg"
          alt=""
          width={24}
          height={24}
        />
      </span>
      <p className="text-base leading-[1.35] font-semibold text-[#22262b]">
        {title}
      </p>
      <p className="text-[13.5px] leading-[1.35] text-[#676e78]">
        {description ?? t("errorDescription")}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-[#e9ecef] bg-white px-4 py-2.5 text-[13.5px] leading-[1.35] font-semibold text-[#22262b]"
        >
          {t("retry")}
        </button>
      ) : null}
    </div>
  );
}

export function MobileOfflineBanner({
  detail,
  onRefresh,
}: {
  detail?: string;
  onRefresh?: () => void;
}) {
  const t = useTranslations("mobile.states");
  return (
    <div
      role="status"
      className="flex w-full items-center gap-2.5 rounded-[18px] bg-[#f5f6f8] px-3.5 py-3"
    >
      <Image src="/mobile/icon-info-muted.svg" alt="" width={20} height={20} />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35]">
        <p className="text-[14.5px] font-semibold text-[#22262b]">
          {t("offlineTitle")}
        </p>
        <p className="truncate text-[12.5px] text-[#858c96]">
          {detail ?? t("offlineDetail")}
        </p>
      </div>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="text-[13.5px] leading-[1.35] font-semibold text-[#22262b]"
        >
          {t("refresh")}
        </button>
      ) : null}
    </div>
  );
}
