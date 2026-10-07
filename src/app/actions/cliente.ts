"use server";

// Ações da área do cliente. Quem chama não está logado: o acesso vem do código da galeria,
// guardado num cookie e conferido no banco a cada ação.

import { cookies } from "next/headers";
import { Query } from "node-appwrite";
import { DATABASE, TABLES, admin, clientCookie } from "@/lib/appwrite/server";
import { type ClientRow, type PhotoRow, clientToRow, rowToClient, rowToGallery, rowToStudio } from "@/lib/appwrite/rows";
import {
  clientAccess,
  clientCanSee,
  findGalleryRow,
  isExpiredRow,
  isOpenForClients,
  loadStudioRow,
  photosOf,
  refreshStatus,
} from "@/lib/appwrite/queries";
import { defaultStudio, toggleBwRequest, toggleSelection, withComment } from "@/lib/gallery-logic";
import type { Gallery, GalleryClient, StudioSettings } from "@/lib/types";

export interface ClientView {
  studio: StudioSettings;
  /** Sem acesso, vem só o necessário para a tela do código (capa, nomes, tema). */
  gallery: Gallery | null;
  clientId: string | null;
  /** Fechada: arquivada, expirada ou ainda não enviada. */
  closed: false | "indisponivel" | "expirada";
}

/** Outros clientes da galeria aparecem só como "existe alguém", sem nome, código ou seleção. */
function stub(c: GalleryClient): GalleryClient {
  return { id: c.id, name: "", email: "", accessCode: "", selection: { photoIds: [], comments: {}, bwIds: [] }, finalizedAt: c.finalizedAt };
}

export async function loadClientView(galleryId: string): Promise<ClientView> {
  const studio = rowToStudio(await loadStudioRow(), defaultStudio());
  const row = await findGalleryRow(galleryId);
  if (!row) return { studio, gallery: null, clientId: null, closed: "indisponivel" };

  if (!isOpenForClients(row)) {
    const expired = row.archived || isExpiredRow(row);
    // Para a mensagem "ficou disponível até…".
    const gallery = expired ? rowToGallery(row, [], []) : null;
    return { studio, gallery, clientId: null, closed: expired ? "expirada" : "indisponivel" };
  }

  const access = await clientAccess(galleryId);
  const photos = await photosOf(galleryId);

  if (!access) {
    const cover = photos.find((p) => p.$id === row.coverPhotoId) ?? photos.find((p) => p.kind === "selecao");
    const gallery = rowToGallery({ ...row, message: "", favoriteIds: "[]" }, cover ? [{ ...cover, kind: "selecao" }] : [], []);
    return { studio, gallery, clientId: null, closed: false };
  }

  const clients = await admin().db.listRows<ClientRow>({
    databaseId: DATABASE,
    tableId: TABLES.clients,
    queries: [Query.equal("galleryId", galleryId), Query.limit(5000)],
  });
  const gallery = rowToGallery(
    row,
    photos.filter((p) => clientCanSee(row, p)),
    clients.rows,
  );
  gallery.clients = gallery.clients.map((c) => (c.id === access.$id ? c : stub(c)));
  return { studio, gallery, clientId: access.$id, closed: false };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Confere o código e libera a galeria neste navegador. */
export async function unlockGallery(galleryId: string, code: string): Promise<boolean> {
  const row = await findGalleryRow(galleryId);
  const clean = code.replace(/\D/g, "").slice(0, 6);
  if (!row || !isOpenForClients(row) || clean.length !== 6) {
    await wait(800);
    return false;
  }
  const { rows } = await admin().db.listRows<ClientRow>({
    databaseId: DATABASE,
    tableId: TABLES.clients,
    queries: [Query.equal("galleryId", galleryId), Query.equal("accessCode", clean), Query.limit(1)],
  });
  const client = rows[0];
  if (!client) {
    // Atraso para dificultar quem tenta adivinhar códigos.
    await wait(800);
    return false;
  }
  (await cookies()).set(clientCookie(galleryId), `${client.$id}.${client.accessCode}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return true;
}

/** Carrega o necessário para alterar a seleção do cliente que está com o código. */
async function selectionContext(galleryId: string) {
  const access = await clientAccess(galleryId);
  const row = await findGalleryRow(galleryId);
  if (!access || !row || !isOpenForClients(row)) throw new Error("Acesso expirado. Abra o link e digite o código de novo.");
  const gallery = rowToGallery(row, [], []);
  return { gallery, client: rowToClient(access) };
}

async function saveSelection(before: GalleryClient, after: GalleryClient) {
  if (after === before) return;
  await admin().db.updateRow({ databaseId: DATABASE, tableId: TABLES.clients, rowId: after.id, data: clientToRow({ selection: after.selection }) });
}

async function isSelectionPhoto(galleryId: string, photoId: string) {
  try {
    const p = await admin().db.getRow<PhotoRow>({ databaseId: DATABASE, tableId: TABLES.photos, rowId: photoId });
    return p.galleryId === galleryId && p.kind === "selecao";
  } catch {
    return false;
  }
}

export async function toggleSelected(galleryId: string, photoId: string) {
  const { gallery, client } = await selectionContext(galleryId);
  if (!client.selection.photoIds.includes(photoId) && !(await isSelectionPhoto(galleryId, photoId))) return;
  await saveSelection(client, toggleSelection(gallery, client, photoId));
}

export async function toggleBw(galleryId: string, photoId: string) {
  const { gallery, client } = await selectionContext(galleryId);
  await saveSelection(client, toggleBwRequest(gallery, client, photoId));
}

export async function setComment(galleryId: string, photoId: string, comment: string) {
  const { gallery, client } = await selectionContext(galleryId);
  if (gallery.status !== "selecao" || client.finalizedAt) return;
  if (!(await isSelectionPhoto(galleryId, photoId))) return;
  await saveSelection(client, withComment(client, photoId, comment));
}

export async function finalizeSelection(galleryId: string) {
  const { gallery, client } = await selectionContext(galleryId);
  if (gallery.status !== "selecao" || client.finalizedAt) return;
  await admin().db.updateRow({ databaseId: DATABASE, tableId: TABLES.clients, rowId: client.id, data: { finalizedAt: new Date().toISOString() } });
  await refreshStatus(galleryId);
}
