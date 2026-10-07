// Regras do fluxo usadas no navegador (atualização imediata da tela) e no servidor (que é quem vale).

import type { Gallery, GalleryClient, StudioSettings } from "./types";

export const defaultStudio = (): StudioSettings => ({
  name: "Aos Olhos",
  watermark: { kind: "texto", text: "AOS OLHOS", position: "mosaico", opacity: 0.35, size: 0.18 },
});

/** A galeria fica "finalizada" quando todos os clientes finalizaram a seleção. */
export function derivedStatus(g: Pick<Gallery, "status" | "clients">): Gallery["status"] {
  if (g.status !== "selecao" && g.status !== "finalizada") return g.status;
  const allDone = g.clients.length > 0 && g.clients.every((c) => c.finalizedAt);
  return allDone ? "finalizada" : "selecao";
}

export function withDerivedStatus(g: Gallery): Gallery {
  return { ...g, status: derivedStatus(g) };
}

/** Código de 6 dígitos que não se repete dentro da galeria. */
export function randomCode(taken: string[] = []) {
  let code: string;
  do code = String(Math.floor(100000 + Math.random() * 900000));
  while (taken.includes(code));
  return code;
}

export const shortId = () => Math.random().toString(36).slice(2, 10);

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Id legível para o link da galeria (o Appwrite aceita até 36 caracteres). */
export function galleryIdFor(title: string, clientName: string) {
  const base = slugify(`${title} ${clientName}`).slice(0, 30).replace(/-$/, "") || "galeria";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Marca/desmarca uma foto respeitando o limite do pacote. Devolve o cliente sem mudança se não puder. */
export function toggleSelection(g: Gallery, c: GalleryClient, photoId: string): GalleryClient {
  if (g.status !== "selecao" || c.finalizedAt) return c;
  const has = c.selection.photoIds.includes(photoId);
  if (!has && !g.allowExtras && c.selection.photoIds.length >= g.includedPhotos) return c;
  const photoIds = has ? c.selection.photoIds.filter((p) => p !== photoId) : [...c.selection.photoIds, photoId];
  // Desmarcar a foto também tira o pedido de preto e branco.
  const bwIds = has ? c.selection.bwIds.filter((p) => p !== photoId) : c.selection.bwIds;
  return { ...c, selection: { ...c.selection, photoIds, bwIds } };
}

export function toggleBwRequest(g: Gallery, c: GalleryClient, photoId: string): GalleryClient {
  if (g.status !== "selecao" || c.finalizedAt || !c.selection.photoIds.includes(photoId)) return c;
  const { bwIds } = c.selection;
  return { ...c, selection: { ...c.selection, bwIds: bwIds.includes(photoId) ? bwIds.filter((p) => p !== photoId) : [...bwIds, photoId] } };
}

export function withComment(c: GalleryClient, photoId: string, comment: string): GalleryClient {
  const comments = { ...c.selection.comments };
  if (comment.trim()) comments[photoId] = comment.slice(0, 1000);
  else delete comments[photoId];
  return { ...c, selection: { ...c.selection, comments } };
}

/** Tira a foto da seleção de um cliente (usado ao apagar a foto). */
export function withoutPhoto(c: GalleryClient, photoId: string): GalleryClient {
  const comments = { ...c.selection.comments };
  delete comments[photoId];
  return {
    ...c,
    selection: {
      photoIds: c.selection.photoIds.filter((p) => p !== photoId),
      comments,
      bwIds: c.selection.bwIds.filter((p) => p !== photoId),
    },
  };
}
