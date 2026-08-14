import type { Project } from "@/lib/ai/types";

// Export a project as ONE self-contained HTML file.
//
// Everything in this app lives in the browser's IndexedDB, which means a
// tester's work is invisible to everyone else and dies with their site data.
// For a prototype being passed around a company that's a real limitation, so
// export produces a single file — images inlined as data URIs — that opens in
// any browser and can be emailed as-is.

const escapeHtml = (s: string) =>
  s.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

export function buildStoryboardHtml(project: Project): string {
  const brief = project.brief;
  const shotCount = project.scenes.reduce((n, s) => n + s.shots.length, 0);

  const scenes = project.scenes
    .map(
      (scene, i) => `
    <section class="scene">
      <h2><span class="num">Scene ${i + 1}</span> ${escapeHtml(scene.title)}</h2>
      ${scene.description ? `<p class="desc">${escapeHtml(scene.description)}</p>` : ""}
      <div class="shots">
        ${scene.shots
          .map(
            (shot, j) => `
          <figure class="shot">
            ${
              shot.image
                ? `<img src="${shot.image}" alt="${escapeHtml(shot.title)}">`
                : `<div class="noimg">No storyboard frame</div>`
            }
            <figcaption>
              <strong>${i + 1}.${j + 1} ${escapeHtml(shot.title)}</strong>
              ${shot.screenplay ? `<pre>${escapeHtml(shot.screenplay)}</pre>` : ""}
            </figcaption>
          </figure>`
          )
          .join("")}
        ${scene.shots.length === 0 ? `<p class="empty">No shots in this scene.</p>` : ""}
      </div>
    </section>`
    )
    .join("");

  const assets = project.assets
    .map(
      (a) => `
      <figure class="asset">
        ${a.image ? `<img src="${a.image}" alt="${escapeHtml(a.name)}">` : `<div class="noimg"></div>`}
        <figcaption>
          <strong>${escapeHtml(a.name)}</strong>
          <span>${escapeHtml(a.subtitle)}</span>
          ${a.description ? `<p>${escapeHtml(a.description)}</p>` : ""}
        </figcaption>
      </figure>`
    )
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(project.title)} — Storyboard</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; background:#0a0a0b; color:#f5f5f6;
         font:15px/1.6 Roboto,ui-sans-serif,system-ui,"Segoe UI",Helvetica,Arial,sans-serif; }
  .wrap { max-width:1100px; margin:0 auto; padding:40px 24px 80px; }
  h1 { font-size:34px; margin:0 0 4px; }
  .meta { color:#8a8a90; font-size:14px; margin-bottom:28px; }
  .summary { background:#161618; border:1px solid #2a2a2e; border-radius:14px;
             padding:20px; margin-bottom:36px; }
  .summary h3 { margin:0 0 8px; font-size:13px; letter-spacing:.08em;
                text-transform:uppercase; color:#8a8a90; }
  h2 { font-size:20px; margin:36px 0 6px; }
  .num { color:#ff0033; font-size:13px; letter-spacing:.08em;
         text-transform:uppercase; display:block; }
  .desc { color:#8a8a90; margin:0 0 16px; }
  .shots { display:grid; gap:20px; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); }
  figure { margin:0; background:#161618; border:1px solid #2a2a2e;
           border-radius:12px; overflow:hidden; }
  figure img { width:100%; display:block; aspect-ratio:16/9; object-fit:cover; }
  .asset img { aspect-ratio:4/5; }
  .noimg { aspect-ratio:16/9; display:flex; align-items:center; justify-content:center;
           background:#1d1d20; color:#6a6a70; font-size:13px; }
  figcaption { padding:12px 14px; font-size:14px; }
  figcaption span { color:#8a8a90; font-size:12px; text-transform:uppercase;
                    letter-spacing:.06em; display:block; margin-top:2px; }
  figcaption p { color:#8a8a90; font-size:13px; margin:8px 0 0; }
  pre { white-space:pre-wrap; font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;
        color:#c9c9cf; background:#0f0f11; border-radius:8px; padding:10px;
        margin:10px 0 0; }
  .assets { display:grid; gap:18px; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); }
  .empty { color:#6a6a70; font-size:14px; }
  footer { margin-top:56px; padding-top:20px; border-top:1px solid #2a2a2e;
           color:#6a6a70; font-size:13px; }
  @media print { body { background:#fff; color:#000; } figure { break-inside:avoid; } }
</style></head>
<body><div class="wrap">
  <h1>${escapeHtml(project.title)}</h1>
  <p class="meta">
    ${project.format === "short" ? "YouTube Short · 9:16" : "YouTube Video · 16:9"}
    ${brief?.styleLabel ? ` · ${escapeHtml(brief.styleLabel)}` : ""}
    · ${project.scenes.length} scenes · ${shotCount} shots
  </p>

  ${
    brief?.summary
      ? `<div class="summary"><h3>Story</h3><p>${escapeHtml(brief.summary)}</p></div>`
      : ""
  }

  ${assets ? `<h2>Cast &amp; Locations</h2><div class="assets">${assets}</div>` : ""}

  ${scenes}

  <footer>
    Exported from PROTOTYPE Studio on ${new Date().toLocaleString()}.
    Storyboard frames only — this prototype does not render video.
  </footer>
</div></body></html>`;
}

/** Trigger a browser download of the storyboard file. */
export function downloadStoryboard(project: Project): void {
  const html = buildStoryboardHtml(project);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "storyboard"}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has certainly started.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
