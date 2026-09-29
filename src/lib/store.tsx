"use client";

// Camada de dados provisória: guarda tudo no IndexedDB do navegador.
// Quando o Appwrite entrar, estas mesmas ações passam a chamar a API.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { seedGalleries } from "./mock-data";
import type { Gallery, NewGallery, Photo } from "./types";

const STORAGE_KEY = "aos-olhos:v1";

interface StoreValue {
  ready: boolean;
  galleries: Gallery[];
  getGallery: (id: string) => Gallery | undefined;
  createGallery: (data: NewGallery) => Gallery;
  updateGallery: (id: string, patch: Partial<Gallery>) => void;
  deleteGallery: (id: string) => void;
  addPhotos: (id: string, photos: Photo[]) => void;
  removePhoto: (id: string, photoId: string) => void;
  toggleFavorite: (id: string, photoId: string) => void;
  sendToClient: (id: string) => void;
  toggleSelected: (id: string, photoId: string) => void;
  setComment: (id: string, photoId: string, comment: string) => void;
  finalizeSelection: (id: string) => void;
  reopenSelection: (id: string) => void;
  addDeliveryPhotos: (id: string, photos: Photo[]) => void;
  removeDeliveryPhoto: (id: string, photoId: string) => void;
  deliver: (id: string) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const now = () => new Date().toISOString();

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    get<Gallery[]>(STORAGE_KEY)
      .then((saved) => setGalleries(saved ?? seedGalleries()))
      .catch(() => setGalleries(seedGalleries()))
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (loaded.current) set(STORAGE_KEY, galleries).catch(() => {});
  }, [galleries]);

  const edit = useCallback((id: string, fn: (g: Gallery) => Gallery) => {
    setGalleries((list) => list.map((g) => (g.id === id ? fn(g) : g)));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      galleries,
      getGallery: (id) => galleries.find((g) => g.id === id),
      createGallery: (data) => {
        const base = slugify(`${data.title} ${data.clientName}`) || "galeria";
        const id = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const gallery: Gallery = {
          ...data,
          id,
          accessCode: randomCode(),
          status: "rascunho",
          createdAt: now(),
          photos: [],
          favoriteIds: [],
          selection: { photoIds: [], comments: {} },
          deliveryPhotos: [],
        };
        setGalleries((list) => [gallery, ...list]);
        return gallery;
      },
      updateGallery: (id, patch) => edit(id, (g) => ({ ...g, ...patch })),
      deleteGallery: (id) => setGalleries((list) => list.filter((g) => g.id !== id)),
      addPhotos: (id, photos) =>
        edit(id, (g) => ({
          ...g,
          photos: [...g.photos, ...photos],
          coverPhotoId: g.coverPhotoId ?? photos[0]?.id,
        })),
      removePhoto: (id, photoId) =>
        edit(id, (g) => {
          const photos = g.photos.filter((p) => p.id !== photoId);
          const comments = { ...g.selection.comments };
          delete comments[photoId];
          return {
            ...g,
            photos,
            coverPhotoId: g.coverPhotoId === photoId ? photos[0]?.id : g.coverPhotoId,
            favoriteIds: g.favoriteIds.filter((f) => f !== photoId),
            selection: { photoIds: g.selection.photoIds.filter((s) => s !== photoId), comments },
          };
        }),
      toggleFavorite: (id, photoId) =>
        edit(id, (g) => ({
          ...g,
          favoriteIds: g.favoriteIds.includes(photoId)
            ? g.favoriteIds.filter((f) => f !== photoId)
            : [...g.favoriteIds, photoId],
        })),
      sendToClient: (id) =>
        edit(id, (g) => ({
          ...g,
          status: g.status === "rascunho" ? "selecao" : g.status,
          sentAt: g.sentAt ?? now(),
        })),
      toggleSelected: (id, photoId) =>
        edit(id, (g) => {
          if (g.status !== "selecao") return g;
          const has = g.selection.photoIds.includes(photoId);
          if (!has && !g.allowExtras && g.selection.photoIds.length >= g.includedPhotos) return g;
          const photoIds = has
            ? g.selection.photoIds.filter((p) => p !== photoId)
            : [...g.selection.photoIds, photoId];
          return { ...g, selection: { ...g.selection, photoIds } };
        }),
      setComment: (id, photoId, comment) =>
        edit(id, (g) => {
          const comments = { ...g.selection.comments };
          if (comment.trim()) comments[photoId] = comment;
          else delete comments[photoId];
          return { ...g, selection: { ...g.selection, comments } };
        }),
      finalizeSelection: (id) => edit(id, (g) => ({ ...g, status: "finalizada", finalizedAt: now() })),
      reopenSelection: (id) => edit(id, (g) => ({ ...g, status: "selecao", finalizedAt: undefined })),
      addDeliveryPhotos: (id, photos) =>
        edit(id, (g) => ({ ...g, deliveryPhotos: [...g.deliveryPhotos, ...photos] })),
      removeDeliveryPhoto: (id, photoId) =>
        edit(id, (g) => ({ ...g, deliveryPhotos: g.deliveryPhotos.filter((p) => p.id !== photoId) })),
      deliver: (id) => edit(id, (g) => ({ ...g, status: "entregue", deliveredAt: now() })),
      resetDemo: () => setGalleries(seedGalleries()),
    }),
    [ready, galleries, edit],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}
