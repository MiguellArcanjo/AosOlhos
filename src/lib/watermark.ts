import type { StudioSettings } from "./types";

// Grava a marca d'água nos pixels da imagem (não é só uma camada por cima).
// Por enquanto roda no navegador; com o Appwrite, o mesmo desenho passa a ser feito
// no servidor e o cliente só recebe a versão marcada — o original nunca sai de lá.

type Watermark = StudioSettings["watermark"];

const cache = new Map<string, Promise<string>>();

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawText(ctx: CanvasRenderingContext2D, w: number, h: number, wm: Watermark) {
  const fontSize = Math.max(14, w * wm.size * 0.35);
  ctx.font = `500 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = Math.max(1, fontSize / 30);

  const text = wm.text.split("").join(String.fromCharCode(8202)); // espaçamento entre letras
  const paint = (x: number, y: number) => {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  };

  if (wm.position === "centro") return paint(w / 2, h / 2);
  if (wm.position === "canto") {
    ctx.textAlign = "right";
    return paint(w - fontSize * 0.8, h - fontSize * 0.9);
  }
  // Mosaico: repete na diagonal por toda a foto — o mais difícil de recortar.
  const stepX = ctx.measureText(text).width + fontSize * 2.5;
  const stepY = fontSize * 4;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 7);
  const reach = Math.hypot(w, h);
  for (let y = -reach; y < reach; y += stepY) {
    const offset = (Math.round(y / stepY) % 2) * (stepX / 2);
    for (let x = -reach; x < reach; x += stepX) paint(x + offset, y);
  }
  ctx.restore();
}

function drawLogo(ctx: CanvasRenderingContext2D, w: number, h: number, wm: Watermark, logo: HTMLImageElement) {
  const lw = w * wm.size;
  const lh = (logo.height / logo.width) * lw;
  if (wm.position === "centro") return ctx.drawImage(logo, (w - lw) / 2, (h - lh) / 2, lw, lh);
  if (wm.position === "canto") return ctx.drawImage(logo, w - lw - w * 0.03, h - lh - w * 0.03, lw, lh);
  for (let y = lh / 2; y < h; y += lh * 2.5) {
    for (let x = lw / 4; x < w; x += lw * 1.8) ctx.drawImage(logo, x, y, lw, lh);
  }
}

async function render(src: string, studio: StudioSettings): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  ctx.globalAlpha = studio.watermark.opacity;

  const useLogo = studio.watermark.kind === "logo" && studio.logo;
  if (useLogo) drawLogo(ctx, canvas.width, canvas.height, studio.watermark, await loadImage(studio.logo!));
  else drawText(ctx, canvas.width, canvas.height, studio.watermark);

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error("Falha ao gerar a marca d'água");
  return URL.createObjectURL(blob);
}

export function settingsKey(studio: StudioSettings) {
  const wm = studio.watermark;
  return `${wm.kind}|${wm.text}|${wm.position}|${wm.opacity}|${wm.size}|${studio.logo?.length ?? 0}`;
}

/** URL (blob:) da foto já com a marca d'água; o resultado fica em cache por foto + configuração. */
export function watermarked(photoId: string, src: string, studio: StudioSettings) {
  const key = `${photoId}|${settingsKey(studio)}`;
  let result = cache.get(key);
  if (!result) {
    result = render(src, studio);
    result.catch(() => cache.delete(key));
    cache.set(key, result);
  }
  return result;
}
