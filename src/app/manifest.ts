import type { MetadataRoute } from "next";

import { MOBILE_HOME } from "@/lib/mobile";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Menton",
    short_name: "Menton",
    description: "Mentorluk görüşmelerin, görevlerin ve mesajların cebinde.",
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
