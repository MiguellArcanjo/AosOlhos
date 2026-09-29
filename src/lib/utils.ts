import type { Gallery, GalleryStatus, Photo } from "./types";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const statusInfo: Record<GalleryStatus, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-stone-100 text-stone-600" },
  selecao: { label: "Aguardando seleção", className: "bg-amber-50 text-amber-800" },
  finalizada: { label: "Seleção recebida", className: "bg-sky-50 text-sky-800" },
  entregue: { label: "Entregue", className: "bg-emerald-50 text-emerald-800" },
};

export function formatDate(iso?: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Dias até a data (negativo = já passou). */
export function daysUntil(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86_400_000);
}

export function deadlineLabel(iso: string) {
  const days = daysUntil(iso);
  if (days < 0) return `Prazo encerrado há ${-days} dia${days === -1 ? "" : "s"}`;
  if (days === 0) return "Prazo termina hoje";
  return `${days} dia${days === 1 ? "" : "s"} para o fim do prazo`;
}

export function coverOf(g: Gallery) {
  return g.photos.find((p) => p.id === g.coverPhotoId) ?? g.photos[0];
}

export function extrasOf(g: Gallery) {
  return Math.max(0, g.selection.photoIds.length - g.includedPhotos);
}

export function galleryLink(g: Gallery) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/g/${g.id}`;
}

export function fileBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

/**
 * Lê as imagens escolhidas e gera versões reduzidas no navegador.
 * Enquanto não há backend, é isso que fica salvo; depois o original vai para o Appwrite.
 */
export async function filesToPhotos(files: File[], maxSize = 1600): Promise<Photo[]> {
  const images = files.filter((f) => f.type.startsWith("image/"));
  const photos: Photo[] = [];
  for (const file of images) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    photos.push({
      id: crypto.randomUUID(),
      name: file.name,
      src: canvas.toDataURL("image/jpeg", 0.85),
      width,
      height,
    });
  }
  return photos;
}
