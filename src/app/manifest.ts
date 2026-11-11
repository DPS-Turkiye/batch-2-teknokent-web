import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

import { MOBILE_HOME } from "@/lib/mobile";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("metadata");
  return {
    name: "Menton",
    short_name: "Menton",
    description: t("manifestDescription"),
    lang: "tr",
    start_url: MOBILE_HOME,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
