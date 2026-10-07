"use client";

// Camada de dados provisória: guarda tudo no IndexedDB do navegador.
// Quando o Appwrite entrar, estas mesmas ações passam a chamar a API.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { defaultStudio, seedGalleries } from "./mock-data";
import type { Gallery, GalleryClient, GalleryFields, NewGallery, Photo, StudioSettings } from "./types";

const STORAGE_KEY = "aos-olhos:v2";

interface Saved {
  galleries: Gallery[];
  studio: StudioSettings;
}

interface StoreValue {
  ready: boolean;
  galleries: Gallery[];
  studio: StudioSettings;
  updateStudio: (patch: Partial<StudioSettings>) => void;
  getGallery: (id: string) => Gallery | undefined;
  createGallery: (data: NewGallery) => Gallery;
  updateGallery: (id: string, patch: Partial<GalleryFields> & { coverPhotoId?: string }) => void;
  deleteGallery: (id: string) => void;
  /** Renomeia a pasta do painel em todas as galerias que estão nela. */
  renameCategory: (from: string, to: string) => void;
  setArchived: (id: string, archived: boolean) => void;
  // Fotos e pastas
  addPhotos: (id: string, photos: Photo[], folderId?: string) => void;
  removePhoto: (id: string, photoId: string) => void;
  toggleFavorite: (id: string, photoId: string) => void;
  addFolder: (id: string, name: string) => string;
  renameFolder: (id: string, folderId: string, name: string) => void;
  removeFolder: (id: string, folderId: string) => void;
  movePhotos: (id: string, photoIds: string[], folderId: string | undefined) => void;
  // Clientes
  addClient: (id: string, name: string, email: string) => void;
  updateClient: (id: string, clientId: string, patch: Partial<Pick<GalleryClient, "name" | "email">>) => void;
  removeClient: (id: string, clientId: string) => void;
  // Fluxo
  sendToClient: (id: string) => void;
  toggleSelected: (id: string, clientId: string, photoId: string) => void;
  setComment: (id: string, clientId: string, photoId: string, comment: string) => void;
  toggleBw: (id: string, clientId: string, photoId: string) => void;
  finalizeSelection: (id: string, clientId: string) => void;
  reopenSelection: (id: string, clientId: string) => void;
  addDeliveryPhotos: (id: string, photos: Photo[]) => void;
  removeDeliveryPhoto: (id: string, photoId: string) => void;
  deliver: (id: string) => void;
  // Entrega no dia
  addSameDayPhotos: (id: string, photos: Photo[]) => void;
  removeSameDayPhoto: (id: string, photoId: string) => void;
  releaseSameDay: (id: string) => void;
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

/** Código de 6 dígitos que não se repete dentro da galeria. */
function randomCode(taken: string[] = []) {
  let code: string;
  do code = String(Math.floor(100000 + Math.random() * 900000));
  while (taken.includes(code));
  return code;
}

const now = () => new Date().toISOString();
const shortId = () => Math.random().toString(36).slice(2, 8);

function newClient(name: string, email: string, taken: string[]): GalleryClient {
  return { id: shortId(), name, email, accessCode: randomCode(taken), selection: { photoIds: [], comments: {}, bwIds: [] } };
}

/** Completa campos novos em galerias salvas por versões anteriores. */
function normalize(g: Gallery): Gallery {
  return {
    ...g,
    category: g.category ?? "",
    sameDayCount: g.sameDayCount ?? 0,
    sameDayPhotos: g.sameDayPhotos ?? [],
    clients: g.clients.map((c) => ({ ...c, selection: { ...c.selection, bwIds: c.selection.bwIds ?? [] } })),
  };
}

/** A galeria fica "finalizada" quando todos os clientes finalizaram a seleção. */
function withDerivedStatus(g: Gallery): Gallery {
  if (g.status !== "selecao" && g.status !== "finalizada") return g;
  const allDone = g.clients.length > 0 && g.clients.every((c) => c.finalizedAt);
  return { ...g, status: allDone ? "finalizada" : "selecao" };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [studio, setStudio] = useState<StudioSettings>(defaultStudio);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    get<Saved>(STORAGE_KEY)
      .then((saved) => {
        setGalleries(saved?.galleries.map(normalize) ?? seedGalleries());
        if (saved?.studio) setStudio(saved.studio);
      })
      .catch(() => setGalleries(seedGalleries()))
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (loaded.current) set(STORAGE_KEY, { galleries, studio } satisfies Saved).catch(() => {});
  }, [galleries, studio]);

  const edit = useCallback((id: string, fn: (g: Gallery) => Gallery) => {
    setGalleries((list) => list.map((g) => (g.id === id ? fn(g) : g)));
  }, []);

  const editClient = useCallback(
    (id: string, clientId: string, fn: (c: GalleryClient, g: Gallery) => GalleryClient) =>
      edit(id, (g) => withDerivedStatus({ ...g, clients: g.clients.map((c) => (c.id === clientId ? fn(c, g) : c)) })),
    [edit],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      galleries,
      studio,
      updateStudio: (patch) => setStudio((s) => ({ ...s, ...patch })),
      getGallery: (id) => galleries.find((g) => g.id === id),
      createGallery: ({ clientEmail, ...data }) => {
        const base = slugify(`${data.title} ${data.clientName}`) || "galeria";
        const gallery: Gallery = {
          ...data,
          category: data.category.trim(),
          id: `${base}-${Math.random().toString(36).slice(2, 6)}`,
          clients: [newClient(data.clientName, clientEmail, [])],
          archived: false,
          status: "rascunho",
          createdAt: now(),
          folders: [],
          photos: [],
          favoriteIds: [],
          deliveryPhotos: [],
          sameDayPhotos: [],
        };
        setGalleries((list) => [gallery, ...list]);
        return gallery;
      },
      updateGallery: (id, patch) => edit(id, (g) => ({ ...g, ...patch })),
      deleteGallery: (id) => setGalleries((list) => list.filter((g) => g.id !== id)),
      renameCategory: (from, to) =>
        setGalleries((list) => list.map((g) => (g.category === from ? { ...g, category: to.trim() } : g))),
      setArchived: (id, archived) => edit(id, (g) => ({ ...g, archived })),

      addPhotos: (id, photos, folderId) =>
        edit(id, (g) => ({
          ...g,
          photos: [...g.photos, ...photos.map((p) => ({ ...p, folderId }))],
          coverPhotoId: g.coverPhotoId ?? photos[0]?.id,
        })),
      removePhoto: (id, photoId) =>
        edit(id, (g) => {
          const photos = g.photos.filter((p) => p.id !== photoId);
          return {
            ...g,
            photos,
            coverPhotoId: g.coverPhotoId === photoId ? photos[0]?.id : g.coverPhotoId,
            favoriteIds: g.favoriteIds.filter((f) => f !== photoId),
            clients: g.clients.map((c) => {
              const comments = { ...c.selection.comments };
              delete comments[photoId];
              const { photoIds, bwIds } = c.selection;
              return {
                ...c,
                selection: { photoIds: photoIds.filter((s) => s !== photoId), comments, bwIds: bwIds.filter((s) => s !== photoId) },
              };
            }),
          };
        }),
      toggleFavorite: (id, photoId) =>
        edit(id, (g) => ({
          ...g,
          favoriteIds: g.favoriteIds.includes(photoId)
            ? g.favoriteIds.filter((f) => f !== photoId)
            : [...g.favoriteIds, photoId],
        })),
      addFolder: (id, name) => {
        const folderId = shortId();
        edit(id, (g) => ({ ...g, folders: [...g.folders, { id: folderId, name }] }));
        return folderId;
      },
      renameFolder: (id, folderId, name) =>
        edit(id, (g) => ({ ...g, folders: g.folders.map((f) => (f.id === folderId ? { ...f, name } : f)) })),
      removeFolder: (id, folderId) =>
        edit(id, (g) => ({
          ...g,
          folders: g.folders.filter((f) => f.id !== folderId),
          // As fotos não são apagadas: só saem da pasta.
          photos: g.photos.map((p) => (p.folderId === folderId ? { ...p, folderId: undefined } : p)),
        })),
      movePhotos: (id, photoIds, folderId) =>
        edit(id, (g) => ({ ...g, photos: g.photos.map((p) => (photoIds.includes(p.id) ? { ...p, folderId } : p)) })),

      addClient: (id, name, email) =>
        edit(id, (g) =>
          withDerivedStatus({ ...g, clients: [...g.clients, newClient(name, email, g.clients.map((c) => c.accessCode))] }),
        ),
      updateClient: (id, clientId, patch) => editClient(id, clientId, (c) => ({ ...c, ...patch })),
      removeClient: (id, clientId) =>
        edit(id, (g) => withDerivedStatus({ ...g, clients: g.clients.filter((c) => c.id !== clientId) })),

      sendToClient: (id) =>
        edit(id, (g) => ({
          ...g,
          status: g.status === "rascunho" ? "selecao" : g.status,
          sentAt: g.sentAt ?? now(),
        })),
      toggleSelected: (id, clientId, photoId) =>
        editClient(id, clientId, (c, g) => {
          if (g.status !== "selecao" || c.finalizedAt) return c;
          const has = c.selection.photoIds.includes(photoId);
          if (!has && !g.allowExtras && c.selection.photoIds.length >= g.includedPhotos) return c;
          const photoIds = has ? c.selection.photoIds.filter((p) => p !== photoId) : [...c.selection.photoIds, photoId];
          // Desmarcar a foto também tira o pedido de preto e branco.
          const bwIds = has ? c.selection.bwIds.filter((p) => p !== photoId) : c.selection.bwIds;
          return { ...c, selection: { ...c.selection, photoIds, bwIds } };
        }),
      setComment: (id, clientId, photoId, comment) =>
        editClient(id, clientId, (c) => {
          const comments = { ...c.selection.comments };
          if (comment.trim()) comments[photoId] = comment;
          else delete comments[photoId];
          return { ...c, selection: { ...c.selection, comments } };
        }),
      toggleBw: (id, clientId, photoId) =>
        editClient(id, clientId, (c, g) => {
          if (g.status !== "selecao" || c.finalizedAt || !c.selection.photoIds.includes(photoId)) return c;
          const { bwIds } = c.selection;
          return {
            ...c,
            selection: { ...c.selection, bwIds: bwIds.includes(photoId) ? bwIds.filter((p) => p !== photoId) : [...bwIds, photoId] },
          };
        }),
      finalizeSelection: (id, clientId) => editClient(id, clientId, (c) => ({ ...c, finalizedAt: now() })),
      reopenSelection: (id, clientId) => editClient(id, clientId, (c) => ({ ...c, finalizedAt: undefined })),
      addDeliveryPhotos: (id, photos) => edit(id, (g) => ({ ...g, deliveryPhotos: [...g.deliveryPhotos, ...photos] })),
      removeDeliveryPhoto: (id, photoId) =>
        edit(id, (g) => ({ ...g, deliveryPhotos: g.deliveryPhotos.filter((p) => p.id !== photoId) })),
      deliver: (id) => edit(id, (g) => ({ ...g, status: "entregue", deliveredAt: now() })),
      addSameDayPhotos: (id, photos) =>
        edit(id, (g) => ({
          ...g,
          // Respeita a quantidade combinada para o dia.
          sameDayPhotos: [...g.sameDayPhotos, ...photos].slice(0, Math.max(g.sameDayCount, g.sameDayPhotos.length)),
        })),
      removeSameDayPhoto: (id, photoId) =>
        edit(id, (g) => ({ ...g, sameDayPhotos: g.sameDayPhotos.filter((p) => p.id !== photoId) })),
      releaseSameDay: (id) => edit(id, (g) => ({ ...g, sameDayReleasedAt: g.sameDayReleasedAt ?? now() })),
      resetDemo: () => {
        setGalleries(seedGalleries());
        setStudio(defaultStudio());
      },
    }),
    [ready, galleries, studio, edit, editClient],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}
