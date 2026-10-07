"use server";

// Ações da fotógrafa. Toda função exportada aqui vira um endereço público,
// por isso cada uma começa conferindo o login (requirePhotographer).

import { Query } from "node-appwrite";
import { BUCKET, DATABASE, TABLES, admin, listAll, requirePhotographer } from "@/lib/appwrite/server";
import {
  type ClientRow,
  type GalleryPatch,
  type GalleryRow,
  type PhotoRow,
  clientToRow,
  galleryToRow,
  rowToClient,
  rowToGallery,
  rowToStudio,
} from "@/lib/appwrite/rows";
import { clientsOf, createRow, getGalleryRow, loadStudioRow, photosOf, refreshStatus, updateGalleryRow } from "@/lib/appwrite/queries";
import { STUDIO_ROW } from "@/lib/appwrite/server";
import { defaultStudio, galleryIdFor, randomCode, shortId, withoutPhoto } from "@/lib/gallery-logic";
import type { Gallery, GalleryClient, NewGallery, StudioSettings } from "@/lib/types";

const now = () => new Date().toISOString();

function db() {
  return admin().db;
}

// ---------- Leitura ----------

export async function loadPainel(): Promise<{ galleries: Gallery[]; studio: StudioSettings }> {
  await requirePhotographer();
  const [galleries, photos, clients, studio] = await Promise.all([
    listAll<GalleryRow>(TABLES.galleries, [Query.orderDesc("$createdAt")]),
    listAll<PhotoRow>(TABLES.photos),
    listAll<ClientRow>(TABLES.clients),
    loadStudioRow(),
  ]);
  return {
    galleries: galleries.map((g) =>
      rowToGallery(
        g,
        photos.filter((p) => p.galleryId === g.$id),
        clients.filter((c) => c.galleryId === g.$id),
      ),
    ),
    studio: rowToStudio(studio, defaultStudio()),
  };
}

// ---------- Galeria ----------

/** Campos que o painel pode alterar diretamente (status e datas têm ações próprias). */
const editable = [
  "title",
  "eventDate",
  "clientName",
  "category",
  "includedPhotos",
  "sameDayCount",
  "allowExtras",
  "extraPrice",
  "deadline",
  "expiresAt",
  "message",
  "design",
  "watermark",
  "allowShare",
  "coverPhotoId",
  "folders",
  "favoriteIds",
  "archived",
] as const satisfies (keyof GalleryPatch)[];

export async function createGallery({ clientEmail, ...data }: NewGallery): Promise<Gallery> {
  await requirePhotographer();
  const id = galleryIdFor(data.title, data.clientName);
  const fields: GalleryPatch = { ...data, category: data.category.trim(), status: "rascunho", archived: false, folders: [], favoriteIds: [] };
  const row = await createRow<GalleryRow>(TABLES.galleries, id, galleryToRow(fields));
  const client = await createRow<ClientRow>(TABLES.clients, shortId(), {
    galleryId: id,
    accessCode: randomCode(),
    ...clientToRow({ name: data.clientName, email: clientEmail, selection: { photoIds: [], comments: {}, bwIds: [] } }),
  });
  return rowToGallery(row, [], [client]);
}

export async function updateGallery(id: string, patch: GalleryPatch) {
  await requirePhotographer();
  const allowed: GalleryPatch = {};
  for (const key of editable) if (key in patch) (allowed as Record<string, unknown>)[key] = patch[key];
  if (typeof allowed.category === "string") allowed.category = allowed.category.trim();
  await updateGalleryRow(id, allowed);
}

export async function deleteGallery(id: string) {
  await requirePhotographer();
  const { storage } = admin();
  for (const p of await photosOf(id)) {
    for (const fileId of [p.fileId, p.originalFileId]) {
      if (fileId) await storage.deleteFile({ bucketId: BUCKET, fileId }).catch(() => {});
    }
  }
  await db().deleteRows({ databaseId: DATABASE, tableId: TABLES.photos, queries: [Query.equal("galleryId", id)] });
  await db().deleteRows({ databaseId: DATABASE, tableId: TABLES.clients, queries: [Query.equal("galleryId", id)] });
  await db().deleteRow({ databaseId: DATABASE, tableId: TABLES.galleries, rowId: id });
}

export async function renameCategory(from: string, to: string) {
  await requirePhotographer();
  await db().updateRows({
    databaseId: DATABASE,
    tableId: TABLES.galleries,
    data: { category: to.trim() },
    queries: [Query.equal("category", from)],
  });
}

export async function sendToClient(id: string) {
  await requirePhotographer();
  const row = await getGalleryRow(id);
  await updateGalleryRow(id, { status: row.status === "rascunho" ? "selecao" : row.status, sentAt: row.sentAt ?? now() });
  if (row.status === "rascunho") await refreshStatus(id);
}

export async function deliver(id: string) {
  await requirePhotographer();
  await updateGalleryRow(id, { status: "entregue", deliveredAt: now() });
}

export async function releaseSameDay(id: string) {
  await requirePhotographer();
  const row = await getGalleryRow(id);
  if (!row.sameDayReleasedAt) await updateGalleryRow(id, { sameDayReleasedAt: now() });
}

// ---------- Fotos e pastas ----------

export async function removePhoto(galleryId: string, photoId: string) {
  await requirePhotographer();
  const photo = await db().getRow<PhotoRow>({ databaseId: DATABASE, tableId: TABLES.photos, rowId: photoId });
  if (photo.galleryId !== galleryId) throw new Error("Foto de outra galeria.");
  await db().deleteRow({ databaseId: DATABASE, tableId: TABLES.photos, rowId: photoId });
  const { storage } = admin();
  for (const fileId of [photo.fileId, photo.originalFileId]) {
    if (fileId) await storage.deleteFile({ bucketId: BUCKET, fileId }).catch(() => {});
  }
  if (photo.kind !== "selecao") return;

  // Foto de seleção: sai das favoritas, da capa e da seleção dos clientes.
  const row = await getGalleryRow(galleryId);
  const gallery = rowToGallery(row, [], []);
  let coverPhotoId = gallery.coverPhotoId;
  if (coverPhotoId === photoId) {
    const [first] = (
      await db().listRows<PhotoRow>({
        databaseId: DATABASE,
        tableId: TABLES.photos,
        queries: [Query.equal("galleryId", galleryId), Query.equal("kind", "selecao"), Query.orderAsc("position"), Query.limit(1)],
      })
    ).rows;
    coverPhotoId = first?.$id;
  }
  await updateGalleryRow(galleryId, { coverPhotoId, favoriteIds: gallery.favoriteIds.filter((f) => f !== photoId) });
  for (const c of await clientsOf(galleryId)) {
    const client = rowToClient(c);
    if (!client.selection.photoIds.includes(photoId) && !(photoId in client.selection.comments)) continue;
    await db().updateRow({ databaseId: DATABASE, tableId: TABLES.clients, rowId: c.$id, data: clientToRow(withoutPhoto(client, photoId)) });
  }
}

export async function movePhotos(galleryId: string, photoIds: string[], folderId: string | null) {
  await requirePhotographer();
  if (!photoIds.length) return;
  await db().updateRows({
    databaseId: DATABASE,
    tableId: TABLES.photos,
    data: { folderId },
    queries: [Query.equal("galleryId", galleryId), Query.equal("$id", photoIds)],
  });
}

export async function removeFolder(galleryId: string, folderId: string) {
  await requirePhotographer();
  const gallery = rowToGallery(await getGalleryRow(galleryId), [], []);
  await updateGalleryRow(galleryId, { folders: gallery.folders.filter((f) => f.id !== folderId) });
  // As fotos não são apagadas: só saem da pasta.
  await db().updateRows({
    databaseId: DATABASE,
    tableId: TABLES.photos,
    data: { folderId: null },
    queries: [Query.equal("galleryId", galleryId), Query.equal("folderId", folderId)],
  });
}

// ---------- Clientes ----------

export async function addClient(galleryId: string, name: string, email: string): Promise<GalleryClient> {
  await requirePhotographer();
  const taken = (await clientsOf(galleryId)).map((c) => c.accessCode);
  const row = await createRow<ClientRow>(TABLES.clients, shortId(), {
    galleryId,
    accessCode: randomCode(taken),
    ...clientToRow({ name, email, selection: { photoIds: [], comments: {}, bwIds: [] } }),
  });
  await refreshStatus(galleryId);
  return rowToClient(row);
}

async function clientOf(galleryId: string, clientId: string) {
  const row = await db().getRow<ClientRow>({ databaseId: DATABASE, tableId: TABLES.clients, rowId: clientId });
  if (row.galleryId !== galleryId) throw new Error("Cliente de outra galeria.");
  return row;
}

export async function updateClient(galleryId: string, clientId: string, patch: Partial<Pick<GalleryClient, "name" | "email">>) {
  await requirePhotographer();
  await clientOf(galleryId, clientId);
  await db().updateRow({ databaseId: DATABASE, tableId: TABLES.clients, rowId: clientId, data: clientToRow({ name: patch.name, email: patch.email }) });
}

export async function removeClient(galleryId: string, clientId: string) {
  await requirePhotographer();
  await clientOf(galleryId, clientId);
  await db().deleteRow({ databaseId: DATABASE, tableId: TABLES.clients, rowId: clientId });
  await refreshStatus(galleryId);
}

export async function reopenSelection(galleryId: string, clientId: string) {
  await requirePhotographer();
  await clientOf(galleryId, clientId);
  await db().updateRow({ databaseId: DATABASE, tableId: TABLES.clients, rowId: clientId, data: { finalizedAt: null } });
  await refreshStatus(galleryId);
}

// ---------- Estúdio ----------

export async function updateStudio(studio: StudioSettings) {
  await requirePhotographer();
  await db().upsertRow({
    databaseId: DATABASE,
    tableId: TABLES.studio,
    rowId: STUDIO_ROW,
    data: { name: studio.name, logo: studio.logo ?? null, watermark: JSON.stringify(studio.watermark) },
  });
}
