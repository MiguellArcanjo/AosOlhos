import "server-only";

// Consultas usadas pelo painel, pela área do cliente e pela rota das fotos.

import { cookies } from "next/headers";
import { Query } from "node-appwrite";
import { DATABASE, STUDIO_ROW, TABLES, admin, clientCookie, listAll } from "./server";
import { type ClientRow, type GalleryPatch, type GalleryRow, type PhotoRow, type StudioRow, galleryToRow, rowToClient } from "./rows";
import { derivedStatus } from "@/lib/gallery-logic";

/** Cria uma linha; as colunas não informadas ficam vazias. */
export async function createRow<T>(tableId: string, rowId: string, data: Record<string, unknown>) {
  return (await admin().db.createRow({ databaseId: DATABASE, tableId, rowId, data })) as unknown as T;
}

export async function getGalleryRow(id: string) {
  return admin().db.getRow<GalleryRow>({ databaseId: DATABASE, tableId: TABLES.galleries, rowId: id });
}

export async function findGalleryRow(id: string) {
  try {
    return await getGalleryRow(id);
  } catch {
    return null;
  }
}

export async function updateGalleryRow(id: string, patch: GalleryPatch) {
  await admin().db.updateRow({ databaseId: DATABASE, tableId: TABLES.galleries, rowId: id, data: galleryToRow(patch) });
}

export async function clientsOf(galleryId: string) {
  return listAll<ClientRow>(TABLES.clients, [Query.equal("galleryId", galleryId)]);
}

export async function photosOf(galleryId: string) {
  return listAll<PhotoRow>(TABLES.photos, [Query.equal("galleryId", galleryId)]);
}

export async function loadStudioRow() {
  try {
    return await admin().db.getRow<StudioRow>({ databaseId: DATABASE, tableId: TABLES.studio, rowId: STUDIO_ROW });
  } catch {
    return null;
  }
}

/** Recalcula "finalizada"/"selecao" a partir dos clientes. */
export async function refreshStatus(galleryId: string) {
  const [row, clients] = await Promise.all([getGalleryRow(galleryId), clientsOf(galleryId)]);
  const status = derivedStatus({ status: row.status, clients: clients.map(rowToClient) });
  if (status !== row.status) await updateGalleryRow(galleryId, { status });
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isExpiredRow(g: GalleryRow) {
  return !!g.expiresAt && g.expiresAt < today();
}

/** O cliente consegue abrir a galeria? (não arquivada, não expirada e já enviada ou com fotos do dia) */
export function isOpenForClients(g: GalleryRow) {
  if (g.archived || isExpiredRow(g)) return false;
  return g.status !== "rascunho" || !!g.sameDayReleasedAt;
}

/** Cliente que já digitou o código desta galeria (cookie conferido no banco), ou null. */
export async function clientAccess(galleryId: string): Promise<ClientRow | null> {
  const value = (await cookies()).get(clientCookie(galleryId))?.value;
  const [clientId, code] = value?.split(".") ?? [];
  if (!clientId || !code) return null;
  try {
    const row = await admin().db.getRow<ClientRow>({ databaseId: DATABASE, tableId: TABLES.clients, rowId: clientId });
    return row.galleryId === galleryId && row.accessCode === code ? row : null;
  } catch {
    return null;
  }
}

/** Regras de quais fotos o cliente vê em cada momento da galeria. */
export function clientCanSee(g: GalleryRow, photo: PhotoRow) {
  if (!isOpenForClients(g)) return false;
  if (photo.kind === "dia") return !!g.sameDayReleasedAt;
  if (photo.kind === "entrega") return g.status === "entregue";
  return g.status !== "rascunho";
}
