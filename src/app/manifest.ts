import type { MetadataRoute } from "next";

// Permet d'« installer » MSN sur l'écran d'accueil du téléphone (PWA)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MSN — Moroccan Social Network",
    short_name: "MSN",
    description: "La plateforme exclusive des créateurs marocains",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F0",
    theme_color: "#FAF7F0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
