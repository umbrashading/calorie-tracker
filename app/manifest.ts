import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Calorie Tracker",
    short_name: "Calories",
    description: "Household calorie tracking with AI-assisted logging",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [],
  };
}
