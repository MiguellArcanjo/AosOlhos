import "server-only";

// Conversão entre as linhas do Appwrite e o modelo usado pelas telas (lib/types.ts).
// Listas e objetos ficam guardados como JSON em colunas de texto.

import type { Models } from "node-appwrite";
import { defaultDesign } from "@/lib/design";
import type { Gallery, GalleryClient, GalleryStatus, Photo, StudioSettings } from "@/lib/types";

export type PhotoKind = "selecao" | "entrega" | "dia";

export interface GalleryRow extends Models.Row {
  title: string;
  eventDate: string | null;
  clientName: string | null;
  category: string | null;
  includedPhotos: number | null;
  allowExtras: boolean;
  extraPrice: number | null;
  deadline: string | null;
  expiresAt: string | null;
  archived: boolean;
  message: string | null;
  status: GalleryStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  coverPhotoId: string | null;
  folders: string | null;
  favoriteIds: string | null;
  design: string | null;
  watermark: boolean;
  allowShare: boolean;
  sameDayCount: number | null;
  sameDayReleasedAt: string | null;
}

export interface PhotoRow extends Models.Row {
  galleryId: string;
  kind: PhotoKind;
  name: string | null;
  width: number | null;
  height: number | null;
  folderId: string | null;
  position: number | null;
  fileId: string;
  originalFileId: string | null;
}

export interface ClientRow extends Models.Row {
  galleryId: string;
  name: string | null;
  email: string | null;
  accessCode: string;
  photoIds: string | null;
  comments: string | null;
  bwIds: string | null;
  finalizedAt: string | null;
}

export interface StudioRow extends Models.Row {
  name: string | null;
  logo: string | null;
  watermark: string | null;
}

function json<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Endereço da foto no nosso servidor (confere o acesso antes de entregar o arquivo). */
export const photoUrl = (fileId: string) => `/api/fotos/${fileId}`;

export function rowToPhoto(r: PhotoRow): Photo {
  return {
    id: r.$id,
    name: r.name ?? "foto.jpg",
    src: photoUrl(r.fileId),
    width: r.width ?? 1600,
    height: r.height ?? 1067,
    folderId: r.folderId ?? undefined,
  };
}

export function rowToClient(r: ClientRow): GalleryClient {
  return {
    id: r.$id,
    name: r.name ?? "",
    email: r.email ?? "",
    accessCode: r.accessCode,
    selection: {
      photoIds: json<string[]>(r.photoIds, []),
      comments: json<Record<string, string>>(r.comments, {}),
      bwIds: json<string[]>(r.bwIds, []),
    },
    finalizedAt: r.finalizedAt ?? undefined,
  };
}

export function clientToRow(c: Partial<GalleryClient>) {
  const row: Record<string, unknown> = {};
  if (c.name !== undefined) row.name = c.name;
  if (c.email !== undefined) row.email = c.email;
  if (c.selection) {
    row.photoIds = JSON.stringify(c.selection.photoIds);
    row.comments = JSON.stringify(c.selection.comments);
    row.bwIds = JSON.stringify(c.selection.bwIds);
  }
  if ("finalizedAt" in c) row.finalizedAt = c.finalizedAt ?? null;
  return row;
}

export function rowToGallery(r: GalleryRow, photos: PhotoRow[], clients: ClientRow[]): Gallery {
  const byPosition = (kind: PhotoKind) =>
    photos
      .filter((p) => p.kind === kind)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(rowToPhoto);
  return {
    id: r.$id,
    title: r.title,
    eventDate: r.eventDate ?? "",
    clientName: r.clientName ?? "",
    category: r.category ?? "",
    clients: clients.sort((a, b) => a.$createdAt.localeCompare(b.$createdAt)).map(rowToClient),
    includedPhotos: r.includedPhotos ?? 0,
    allowExtras: r.allowExtras,
    extraPrice: r.extraPrice ?? 0,
    deadline: r.deadline ?? "",
    expiresAt: r.expiresAt ?? undefined,
    archived: r.archived,
    message: r.message ?? "",
    status: r.status,
    createdAt: r.$createdAt,
    sentAt: r.sentAt ?? undefined,
    deliveredAt: r.deliveredAt ?? undefined,
    coverPhotoId: r.coverPhotoId ?? undefined,
    folders: json(r.folders, []),
    photos: byPosition("selecao"),
    favoriteIds: json(r.favoriteIds, []),
    deliveryPhotos: byPosition("entrega"),
    sameDayCount: r.sameDayCount ?? 0,
    sameDayPhotos: byPosition("dia"),
    sameDayReleasedAt: r.sameDayReleasedAt ?? undefined,
    design: { ...defaultDesign(), ...json(r.design, {}) },
    watermark: r.watermark,
    allowShare: r.allowShare,
  };
}

/** Campos da galeria que ficam na própria linha (fotos e clientes têm tabelas próprias). */
export type GalleryPatch = Partial<
  Omit<Gallery, "id" | "createdAt" | "clients" | "photos" | "deliveryPhotos" | "sameDayPhotos">
>;

export function galleryToRow(g: GalleryPatch) {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(g)) {
    if (key === "folders" || key === "favoriteIds" || key === "design") row[key] = JSON.stringify(value);
    else row[key] = value === undefined ? null : value;
  }
  return row;
}

export function rowToStudio(r: StudioRow | null, fallback: StudioSettings): StudioSettings {
  if (!r) return fallback;
  return {
    name: r.name || fallback.name,
    logo: r.logo || undefined,
    watermark: { ...fallback.watermark, ...json(r.watermark, {}) },
  };
}
