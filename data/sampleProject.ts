import type { Asset, Scene } from "@/lib/ai/types";

// "Silent Sunbearer" — the worked example from the video. Characters/locations/
// props and their images/descriptions are transcribed and extracted from it.
// The mock provider seeds a new project from this data.

export const SAMPLE_PROJECT_TITLE = "Silent Sunbearer";

export const SAMPLE_ASSETS: Asset[] = [
  {
    id: "indra",
    type: "character",
    name: "INDRA",
    subtitle: "Character",
    image: "/assets/characters/indra.png",
    status: "ready",
    description:
      "A majestic, celestial King with glowing skin and regal gold armor. He is seen high in the clouds. Initially arrogant with a furrowed brow, he transitions to a state of tearful humility. He sits atop a massive, four-tusked white elephant.",
    voiceDescription: "Indian accent, adult male, bass, gravelly and deep",
  },
  {
    id: "yashoda",
    type: "character",
    name: "YASHODA",
    subtitle: "Character",
    image: "/assets/characters/yashoda.png",
    status: "ready",
    description:
      "Krishna's mother, a warm woman draped in a deep-red silk sari with intricate gold borders. Her eyes hold both maternal worry and quiet devotion.",
    voiceDescription: "Indian accent, adult female, warm, gentle mid-tone",
  },
  {
    id: "krishna",
    type: "character",
    name: "KRISHNA",
    subtitle: "Character",
    image: "/assets/characters/krishna.png",
    status: "ready",
    description:
      "A dark-skinned young boy with lotus-like eyes, wearing a peacock-feather crown, yellow dhoti and gold ornaments. A mischievous yet perfectly calm smile.",
    voiceDescription: "Indian accent, young boy, bright and playful",
  },
  {
    id: "nandu",
    type: "character",
    name: "NANDU",
    subtitle: "Character",
    image: "/assets/characters/nandu.png",
    status: "ready",
    description:
      "A tall, weathered cowherd with a kind but tired face, bare-chested and wrapped in a simple white dhoti, standing on wet earth in the storm.",
    voiceDescription: "Indian accent, adult male, earthy and steady",
  },
  {
    id: "breaking-clouds",
    type: "location",
    name: "THE BREAKING CLOUDS",
    subtitle: "Location",
    image: "/assets/locations/breaking-clouds.png",
    status: "ready",
    description:
      "The first rays of golden sunlight piercing through dissipating black storm clouds after seven days of rain.",
  },
  {
    id: "gokul-village",
    type: "location",
    name: "GOKUL VILLAGE",
    subtitle: "Location",
    image: "/assets/locations/gokul-village.png",
    status: "ready",
    description:
      "A pastoral settlement of thatched huts and cow pens under a violent purple lightning storm.",
  },
  {
    id: "govardhan-hill",
    type: "location",
    name: "GOVARDHAN HILL",
    subtitle: "Location",
    image: "/assets/locations/govardhan-hill.png",
    status: "ready",
    description:
      "A lush, rocky green mountain rising under dark storm clouds — the villagers' ultimate sanctuary.",
  },
  {
    id: "inner-sanctum",
    type: "location",
    name: "THE INNER SANCTUM",
    subtitle: "Location",
    image: "/assets/locations/inner-sanctum.png",
    status: "ready",
    description:
      "The cavernous golden space beneath the lifted hill, lit by the glow of Krishna's own aura.",
  },
  {
    id: "wooden-cow",
    type: "prop",
    name: "WOODEN COW",
    subtitle: "Prop",
    status: "ready",
    description: "A small carved wooden cow used in the village rituals.",
  },
  {
    id: "airavata",
    type: "prop",
    name: "AIRAVATA",
    subtitle: "Prop",
    status: "ready",
    description: "Indra's massive four-tusked white elephant mount.",
  },
];

export const SAMPLE_SCENES: Scene[] = [
  { id: "scene-1", title: "Untitled Scene", description: "", shots: [] },
];
