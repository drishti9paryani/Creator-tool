import type { VisualStyle } from "@/lib/ai/types";

// Visual-style grid from the "Establish your visual style" step.
// Thumbnails are extracted from the source video.
export const STYLES: VisualStyle[] = [
  { id: "3d-cinematic", label: "3D Cinematic", thumbnail: "/assets/styles/3d-cinematic.png" },
  { id: "3d-anime", label: "3D Anime", thumbnail: "/assets/styles/3d-anime.png" },
  { id: "2d-anime", label: "2D Anime", thumbnail: "/assets/styles/2d-anime.png" },
  { id: "watercolor", label: "Watercolor", thumbnail: "/assets/styles/watercolor.png" },
  { id: "sword-sorcery", label: "Sword and Sorcery", thumbnail: "/assets/styles/sword-sorcery.png" },
  { id: "claymation", label: "Tactile Claymation", thumbnail: "/assets/styles/claymation.png" },
  { id: "retro-vhs", label: "Retro VHS", thumbnail: "/assets/styles/retro-vhs.png" },
  { id: "y2k-vinyl", label: "Y2K Vinyl Toy", thumbnail: "/assets/styles/y2k-vinyl.png" },
  { id: "vaporwave-manga", label: "Vaporwave Manga", thumbnail: "/assets/styles/vaporwave-manga.png" },
  { id: "monochrome-manga", label: "Monochrome Manga", thumbnail: "/assets/styles/monochrome-manga.png" },
  { id: "graphic-pop", label: "Graphic Pop Cartoon", thumbnail: "/assets/styles/graphic-pop.png" },
  { id: "modern-vector", label: "Modern Vector Graphic", thumbnail: "/assets/styles/modern-vector.png" },
];
