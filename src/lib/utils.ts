import type { Gallery, GalleryClient, GalleryStatus, Photo } from "./types";

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

export function extrasOf(g: Gallery, c: GalleryClient) {
  return Math.max(0, c.selection.photoIds.length - g.includedPhotos);
}

export function isExpired(g: Gallery) {
  return !!g.expiresAt && daysUntil(g.expiresAt) < 0;
}

/** Aviso curto para galerias que expiram em breve (ou já expiraram). */
export function expiryLabel(g: Gallery) {
  if (!g.expiresAt) return null;
  const days = daysUntil(g.expiresAt);
  if (days < 0) return "Expirada";
  if (days === 0) return "Expira hoje";
  if (days <= 15) return `Expira em ${days} dia${days === 1 ? "" : "s"}`;
  return null;
}

export function finalizedCount(g: Gallery) {
  return g.clients.filter((c) => c.finalizedAt).length;
}

/** Sugestões de pasta para galerias novas. */
const defaultCategories = ["Aniversários", "Casamentos", "Ensaios", "Formaturas"];

/** Pastas em uso nas galerias + sugestões padrão, em ordem alfabética. */
export function categoriesOf(galleries: Gallery[], withDefaults = true) {
  const used = galleries.map((g) => g.category).filter(Boolean);
  return [...new Set([...(withDefaults ? defaultCategories : []), ...used])].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function photosInFolder(photos: Photo[], folderId: string | null) {
  if (folderId === null) return photos;
  if (folderId === "") return photos.filter((p) => !p.folderId);
  return photos.filter((p) => p.folderId === folderId);
}

export function galleryLink(g: Gallery) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/g/${g.id}`;
}

export function fileBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

/** Formatos RAW de câmera: o navegador não abre, precisam ser exportados em JPEG antes. */
const RAW_EXTENSIONS = ["raw", "cr2", "cr3", "nef", "nrw", "arw", "srf", "sr2", "dng", "orf", "rw2", "raf", "pef", "srw", "3fr", "iiq"];

/**
 * Lê as imagens escolhidas e gera versões reduzidas no navegador (é isso que vai para o Appwrite).
 * Arquivos que o navegador não consegue abrir (RAW, HEIC no Chrome…) voltam em `skipped`, sem travar os demais.
 */
export async function filesToPhotos(
  files: File[],
  maxSize = 1600,
): Promise<{ photos: Photo[]; skipped: { name: string; raw: boolean }[] }> {
  const photos: Photo[] = [];
  const skipped: { name: string; raw: boolean }[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (RAW_EXTENSIONS.includes(ext)) {
      skipped.push({ name: file.name, raw: true });
      continue;
    }
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      skipped.push({ name: file.name, raw: false });
      continue;
    }
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
  return { photos, skipped };
}
