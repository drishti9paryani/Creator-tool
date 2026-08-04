import type { StoryOutline } from "@/lib/ai/types";

// Two outline trios transcribed from the source video (Select-a-story step).
// The first trio shows on generate; the second on regenerate.

export const OUTLINE_TRIO_A: StoryOutline[] = [
  {
    id: "divine-umbrella",
    title: "The Divine Umbrella",
    description:
      "As Lord Indra unleashes a terrifying storm to punish Gokul, young Krishna remains unfazed and lifts the massive Govardhan Hill with his pinky finger. The villagers stare in stunned silence as the torrential rains bounce off the mountain's edges like a harmless fountain. The story ends with a cosmic reveal showing that Krishna is holding the weight of the universe just as easily as the hill.",
    characters: [
      "Krishna: A dark-skinned young boy with lotus-like eyes, wearing a peacock feather and a mischievous yet calm smile.",
      "Lord Indra: The regal, prideful King of Gods with golden armor, riding a white elephant through storm clouds.",
    ],
    settings: [
      "Govardhan Hill: A lush, rocky mountain filled with caves and forests that serves as the villagers' ultimate sanctuary.",
      "Gokul Village: A pastoral settlement of thatched huts and cow pens, now being hammered by supernatural rain.",
    ],
  },
  {
    id: "pride-before-fall",
    title: "Pride Before Fall",
    description:
      "Indra boasts of his absolute power while drowning Gokul, but his most powerful lightning bolts simply vanish against the base of Govardhan Hill. He realizes with horror that the 'mere child' lifting the hill isn't even breaking a sweat while Indra is gasping for air. The storm clears to reveal Indra offering his golden crown to a cow as a sign of his newfound humility.",
    characters: [
      "Krishna: A radiant child who remains perfectly still and playful despite the cosmic chaos above him.",
      "Lord Indra: An increasingly panicked deity whose regal composure crumbles as his storms fail to move a single pebble.",
    ],
    settings: [
      "The Celestial Sky: A swirling vortex of dark purple and black clouds illuminated by jagged, supernatural lightning.",
      "The Shelter Beneath: The dry, earthy underside of the mountain where the air is warm and smells of incense.",
    ],
  },
  {
    id: "cowherds-refuge",
    title: "The Cowherd's Refuge",
    description:
      "Nanda, the village head, tries desperately to shield his family with a woven mat as the flood rises, realizing human effort is futile. Suddenly, the earth shakes as Krishna heaves the mountain upward, creating a dry cathedral for the entire village. After the storm, the villagers find that the cows are so relaxed they've fallen asleep during the seven-day siege.",
    characters: [
      "Nanda: A tall, weathered man with a kind face and a heavy woolen shawl, representing the village's leadership.",
      "Krishna: The small, powerful boy whose blue skin glows with a soft light in the darkness of the storm.",
    ],
    settings: [
      "The Flooded Plains: The once-green pastures of Gokul, now a churning sea of gray water and mud.",
      "Mountain Roots: The massive, jagged base of Govardhan that Krishna uproots from the earth.",
    ],
  },
];

export const OUTLINE_TRIO_B: StoryOutline[] = [
  {
    id: "playful-hill",
    title: "The Playful Hill",
    description:
      "While Indra throws a tantrum of thunder, Krishna treats the lifting of the mountain like a game of hide-and-seek with his friends. The villagers realize the mountain isn't just a roof, but a living entity that seems to lean into Krishna's touch. The final shot reveals that the mountain is actually protecting the villagers from Indra's pride long before Krishna lifted it.",
    characters: [
      "Krishna: A cheerful boy who balances a mountain as easily as a ball, laughing with his friends.",
      "Madhumangal: Krishna's comical friend, a small boy with a wooden staff who tries to help 'prop up' the mountain with a stick.",
    ],
    settings: [
      "Govardhan Slopes: Beautiful rocky terrain dotted with vibrant wildflowers that don't even wilt during the lifting.",
      "The Storm Vortex: A terrifying whirlpool of air and water that stops abruptly at the mountain's edge.",
    ],
  },
  {
    id: "seven-nights",
    title: "Seven Nights of Light",
    description:
      "Day by day, the storm grows more violent until the villagers lose all hope of ever seeing the sun again. Krishna stands like a pillar of light for seven days, his smile never fading as he supports the weight of the world. When the sun finally breaks through, Krishna is seen weeping in the clouds, not from anger, but from a sudden realization of his own smallness.",
    characters: [
      "Krishna: An unshakable figure of divine endurance, his little finger perfectly steady under the mountain's peak.",
      "Yashoda: Krishna's mother, a woman with a silk sari and eyes filled with both maternal fear and divine awe.",
    ],
    settings: [
      "The Inner Sanctum: The cavernous space beneath the lifted hill, lit by the glow of Krishna's own aura.",
      "The Breaking Clouds: The first rays of golden sunlight piercing through the dissipating black clouds of Indra's storm.",
    ],
  },
  {
    id: "mountains-mercy",
    title: "The Mountain's Mercy",
    description:
      "The elders of Gokul doubt Krishna's advice to stop Indra's sacrifice, fearing the god's wrath. When the rain arrives, their doubt turns to terror until they see Govardhan Hill literally rising to meet the clouds. In the end, they realize the mountain didn't just save them; it was their faith in Krishna's word that held the mountain up.",
    characters: [
      "Krishna: A visionary child who speaks with the wisdom of ages and moves with the grace of a dancer.",
      "Sridama: A strong young cowherd who initially questions Krishna but becomes his most loyal defender.",
    ],
    settings: [
      "The Ritual Fire: A dying sacrificial altar in the village, extinguished by the first drops of Indra's rain.",
      "The Lifted Peak: The summit of Govardhan, touching the very bottom of the storm clouds.",
    ],
  },
];
