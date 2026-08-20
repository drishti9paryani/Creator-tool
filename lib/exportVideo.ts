// Client-side Ken Burns motion video recorder.
// Uses HTML5 Canvas + MediaRecorder to render and record the animatic sequence
// into a downloadable WebM / MP4 video file directly in the browser.

export interface ClipItem {
  id: string;
  label: string;
  scene: string;
  image?: string;
  screenplay?: string;
}

export async function recordAnimaticVideo(
  clips: ClipItem[],
  options: {
    secondsPerClip?: number;
    aspect?: "16:9" | "9:16";
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<Blob> {
  const secondsPerClip = options.secondsPerClip ?? 2.5;
  const isVertical = options.aspect === "9:16";
  const width = isVertical ? 720 : 1280;
  const height = isVertical ? 1280 : 720;
  const fps = 30;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas 2D context");

  // Pre-load images
  const loadedImages: (HTMLImageElement | null)[] = await Promise.all(
    clips.map(
      (c) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          if (!c.image) return resolve(null);
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = c.image;
        })
    )
  );

  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : MediaRecorder.isTypeSupported("video/webm")
    ? "video/webm"
    : "video/mp4";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  const totalFramesPerClip = Math.round(secondsPerClip * fps);

  for (let cIdx = 0; cIdx < clips.length; cIdx++) {
    const clip = clips[cIdx];
    const img = loadedImages[cIdx];
    options.onProgress?.(cIdx + 1, clips.length);

    // Alternate motion effect per clip
    const motionType = cIdx % 2 === 0 ? "zoom_in" : "pan_right";

    for (let f = 0; f < totalFramesPerClip; f++) {
      const progress = f / totalFramesPerClip; // 0 to 1

      // Clear frame
      ctx.fillStyle = "#0a0a0b";
      ctx.fillRect(0, 0, width, height);

      if (img) {
        ctx.save();
        let scale = 1.0;
        let dx = 0;
        let dy = 0;

        if (motionType === "zoom_in") {
          scale = 1.0 + progress * 0.12; // 1.0 -> 1.12
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          ctx.translate(-width / 2, -height / 2);
        } else {
          scale = 1.08;
          dx = (progress - 0.5) * 40; // -20px to +20px
          ctx.translate(width / 2 + dx, height / 2 + dy);
          ctx.scale(scale, scale);
          ctx.translate(-width / 2, -height / 2);
        }

        // Draw image aspect-fit / aspect-fill
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let renderW = width;
        let renderH = height;
        let renderX = 0;
        let renderY = 0;

        if (imgRatio > canvasRatio) {
          renderW = height * imgRatio;
          renderX = (width - renderW) / 2;
        } else {
          renderH = width / imgRatio;
          renderY = (height - renderH) / 2;
        }

        ctx.drawImage(img, renderX, renderY, renderW, renderH);
        ctx.restore();
      } else {
        // Placeholder frame
        ctx.fillStyle = "#1d1d20";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#8a8a90";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Storyboard Frame", width / 2, height / 2 - 20);
        ctx.font = "16px sans-serif";
        ctx.fillText(clip.label, width / 2, height / 2 + 15);
      }

      // Vignette & subtitle overlay
      const grad = ctx.createLinearGradient(0, height - 140, 0, height);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - 140, width, 140);

      // Text labels
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(clip.scene.toUpperCase(), 30, height - 60);

      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(clip.label, 30, height - 32);

      // Wait 1 frame tick
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
  }

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.stop();
  });
}
