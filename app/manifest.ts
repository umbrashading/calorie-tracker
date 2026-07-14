import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Calorie Tracker",
    short_name: "Calories",
    description: "Household calorie tracking with AI-assisted logging",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
