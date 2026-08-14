// Deterministic placeholder art as inline SVG data URIs.
//
// Why not reuse the bundled sample art? Because a project about "two friends
// opening a coffee shop" showing Krishna's face is a lie the tester has to
// decode. A generated placard — unique per asset, tinted by the chosen visual
// style, labelled with its own type — reads honestly as "art pending" while
// still making the grid look composed rather than broken.
//
// Pure SVG: no dependency, no network, no storage, and it survives being
// persisted to IndexedDB like any other image string.

import type { AssetType } from "@/lib/ai/types";

// Palette per visual style, so placeholders inherit the look the user picked.
const STYLE_PALETTE: Record<string, [string, string]> = {
  "3d-cinematic": ["#2b2338", "#7b4b8f"],
  "2d-anime": ["#1e2a3a", "#4f86c6"],
  "3d-anime": ["#26203a", "#8a6bd1"],
  claymation: ["#33241c", "#b5713f"],
  "graphic-pop": ["#2a1330", "#d8347f"],
  "modern-vector": ["#12242b", "#2aa6a0"],
  "monochrome-manga": ["#1a1a1c", "#6b6b72"],
  "retro-vhs": ["#241335", "#c0407a"],
  "sword-sorcery": ["#2a1f16", "#a8762f"],
  "vaporwave-manga": ["#241243", "#a24bd6"],
  watercolor: ["#1d2a2c", "#66a3a0"],
  "y2k-vinyl": ["#2c1230", "#c74bb0"],
};

const FALLBACK_PALETTE: [string, string] = ["#221f2b", "#6a5b8a"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Up to two initials from a name: "GOKUL VILLAGE" → "GV", "MARA" → "MA". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!)
  );

/**
 * An SVG data URI placard for one asset. Same inputs always produce the same
 * image, so tiles don't reshuffle on re-render or reload.
 */
export function placeholderArt(
  name: string,
  type: AssetType,
  styleId: string
): string {
  const [bg, accent] = STYLE_PALETTE[styleId] ?? FALLBACK_PALETTE;
  const seed = hash(`${name}:${type}`);
  const angle = seed % 360;
  const landscape = type !== "character";
  const w = landscape ? 640 : 512;
  const h = landscape ? 400 : 640;
  const label = type === "character" ? "CHARACTER" : type === "location" ? "LOCATION" : "PROP";

  // Two soft blobs seeded by the name give each placard its own composition.
  const cx1 = 20 + (seed % 60);
  const cy1 = 20 + ((seed >> 5) % 60);
  const cx2 = 20 + ((seed >> 11) % 60);
  const cy2 = 20 + ((seed >> 17) % 60);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">
<stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${accent}"/>
</linearGradient>
<radialGradient id="b1"><stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/><stop offset="100%" stop-color="${accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="b2"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<circle cx="${(cx1 / 100) * w}" cy="${(cy1 / 100) * h}" r="${w * 0.42}" fill="url(#b1)"/>
<circle cx="${(cx2 / 100) * w}" cy="${(cy2 / 100) * h}" r="${w * 0.3}" fill="url(#b2)"/>
<text x="50%" y="48%" text-anchor="middle" dominant-baseline="middle"
 font-family="Roboto, Segoe UI, Helvetica, Arial, sans-serif" font-size="${w * 0.26}"
 font-weight="700" fill="#ffffff" fill-opacity="0.9">${escapeXml(initials(name))}</text>
<text x="50%" y="${h - 46}" text-anchor="middle"
 font-family="Roboto, Segoe UI, Helvetica, Arial, sans-serif" font-size="20"
 letter-spacing="3" fill="#ffffff" fill-opacity="0.72">${escapeXml(label)}</text>
<text x="50%" y="${h - 22}" text-anchor="middle"
 font-family="Roboto, Segoe UI, Helvetica, Arial, sans-serif" font-size="15"
 fill="#ffffff" fill-opacity="0.45">sample art</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Placard for a storyboard frame — wider, captioned with the shot title. */
export function placeholderFrame(shotTitle: string, styleId: string): string {
  const [bg, accent] = STYLE_PALETTE[styleId] ?? FALLBACK_PALETTE;
  const seed = hash(shotTitle);
  const w = 960;
  const h = 540;
  const caption = shotTitle.length > 46 ? shotTitle.slice(0, 45) + "…" : shotTitle;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="g" gradientTransform="rotate(${seed % 360} 0.5 0.5)">
<stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${accent}"/>
</linearGradient>
<radialGradient id="v"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.55"/></radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<rect width="${w}" height="${h}" fill="url(#v)"/>
<g stroke="#ffffff" stroke-opacity="0.16" stroke-width="2">
<line x1="${w / 3}" y1="0" x2="${w / 3}" y2="${h}"/>
<line x1="${(w / 3) * 2}" y1="0" x2="${(w / 3) * 2}" y2="${h}"/>
<line x1="0" y1="${h / 3}" x2="${w}" y2="${h / 3}"/>
<line x1="0" y1="${(h / 3) * 2}" x2="${w}" y2="${(h / 3) * 2}"/>
</g>
<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
 font-family="Roboto, Segoe UI, Helvetica, Arial, sans-serif" font-size="34"
 font-weight="700" fill="#ffffff" fill-opacity="0.92">${escapeXml(caption)}</text>
<text x="50%" y="${h - 34}" text-anchor="middle"
 font-family="Roboto, Segoe UI, Helvetica, Arial, sans-serif" font-size="17"
 letter-spacing="2" fill="#ffffff" fill-opacity="0.5">STORYBOARD · SAMPLE FRAME</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
