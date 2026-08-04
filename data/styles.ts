import type { VisualStyle } from "@/lib/ai/types";

// Visual-style grid from the "Establish your visual style" step.
// Thumbnails are extracted from the source video.
export const STYLES: VisualStyle[] = [
  { id: "3d-cinematic", label: "3D Cinematic", thumbnail: "/assets/styles/3d-cinematic.png", description: "Ultra-detailed 3D stylized animation with rich lighting, cinematic depth of field, and expressive, believable characters. Warm, film-grade color grading." },
  { id: "3d-anime", label: "3D Anime", thumbnail: "/assets/styles/3d-anime.png", description: "Polished 3D rendering with anime-inspired proportions and eyes. Clean surfaces, soft rim light, and a modern game-cinematic feel." },
  { id: "2d-anime", label: "2D Anime", thumbnail: "/assets/styles/2d-anime.png", description: "Hand-drawn 2D anime with crisp linework, cel shading, and vibrant flat colors. Classic Saturday-morning warmth." },
  { id: "watercolor", label: "Watercolor", thumbnail: "/assets/styles/watercolor.png", description: "Soft watercolor washes with visible paper texture, bleeding edges, and a dreamy, storybook palette." },
  { id: "sword-sorcery", label: "Sword and Sorcery", thumbnail: "/assets/styles/sword-sorcery.png", description: "Epic painterly fantasy with dramatic contrast, weathered detail, and heroic, high-saturation composition." },
  { id: "claymation", label: "Tactile Claymation", thumbnail: "/assets/styles/claymation.png", description: "Handmade clay look with fingerprint texture, soft studio lighting, and charming stop-motion imperfection." },
  { id: "retro-vhs", label: "Retro VHS", thumbnail: "/assets/styles/retro-vhs.png", description: "Analog VHS aesthetic with scanlines, chromatic bleed, grain, and nostalgic 80s color casts." },
  { id: "y2k-vinyl", label: "Y2K Vinyl Toy", thumbnail: "/assets/styles/y2k-vinyl.png", description: "Glossy vinyl-figure look with chunky proportions, plastic sheen, and playful Y2K color." },
  { id: "vaporwave-manga", label: "Vaporwave Manga", thumbnail: "/assets/styles/vaporwave-manga.png", description: "Neon vaporwave palette over manga linework — magenta/cyan glow, grids, and dreamy retro-futurism." },
  { id: "monochrome-manga", label: "Monochrome Manga", thumbnail: "/assets/styles/monochrome-manga.png", description: "High-contrast black-and-white manga with screentones, bold inking, and dynamic paneling energy." },
  { id: "graphic-pop", label: "Graphic Pop Cartoon", thumbnail: "/assets/styles/graphic-pop.png", description: "Bold flat pop-cartoon with thick outlines, saturated color blocks, and punchy graphic shapes." },
  { id: "modern-vector", label: "Modern Vector Graphic", thumbnail: "/assets/styles/modern-vector.png", description: "Clean modern vector illustration — geometric shapes, limited palette, and crisp flat gradients." },
];
