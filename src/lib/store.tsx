"use client";

// Camada de dados das telas. Os dados vivem no Appwrite; aqui fica uma cópia para a tela
// responder na hora. Cada ação atualiza a cópia e grava no servidor em seguida.
// Se a gravação falhar, aparece um aviso e os dados são recarregados do servidor.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as painel from "@/app/actions/painel";
import * as cliente from "@/app/actions/cliente";
import { defaultStudio, toggleBwRequest, toggleSelection, withComment, withDerivedStatus, withoutPhoto } from "./gallery-logic";
import type { Gallery, GalleryClient, GalleryFields, NewGallery, Photo, StudioSettings } from "./types";

type PhotoKind = "selecao" | "entrega" | "dia";

/** Painel: tudo da fotógrafa. Cliente: só a galeria do link, depois do código. */
export type StoreSource = { mode: "painel" } | { mode: "cliente"; galleryId: string };

interface StoreValue {
  ready: boolean;
  galleries: Gallery[];
  studio: StudioSettings;
  /** Área do cliente: quem digitou o código (null = ainda não entrou). */
  clientId: string | null;
  /** Área do cliente: galeria fechada (arquivada/expirada) ou ainda não enviada. */
  closed: false | "indisponivel" | "expirada";
  unlock: (code: string) => Promise<boolean>;
  updateStudio: (patch: Partial<StudioSettings>) => void;
  getGallery: (id: string) => Gallery | undefined;
  createGallery: (data: NewGallery) => Promise<Gallery>;
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
}

const StoreContext = createContext<StoreValue | null>(null);

const now = () => new Date().toISOString();
const shortId = () => Math.random().toString(36).slice(2, 8);
const photoList: Record<PhotoKind, "photos" | "deliveryPhotos" | "sameDayPhotos"> = {
  selecao: "photos",
  entrega: "deliveryPhotos",
  dia: "sameDayPhotos",
};

type Loaded =
  | { ok: true; galleries: Gallery[]; studio: StudioSettings; clientId: string | null; closed: StoreValue["closed"] }
  | { ok: false };

/** Busca os dados no servidor (painel inteiro ou só a galeria do cliente). */
async function fetchData(galleryId: string | null): Promise<Loaded> {
  try {
    if (galleryId === null) {
      const data = await painel.loadPainel();
      return { ok: true, ...data, clientId: null, closed: false };
    }
    const view = await cliente.loadClientView(galleryId);
    return { ok: true, galleries: view.gallery ? [view.gallery] : [], studio: view.studio, clientId: view.clientId, closed: view.closed };
  } catch (err) {
    console.error(err);
    return { ok: false };
  }
}

/** Envia uma foto (data URL reduzida no navegador) para o servidor. */
async function uploadPhoto(galleryId: string, kind: PhotoKind, photo: Photo, folderId?: string): Promise<Photo> {
  const blob = await (await fetch(photo.src)).blob();
  const form = new FormData();
  form.set("file", blob, photo.name);
  form.set("id", photo.id);
  form.set("galleryId", galleryId);
  form.set("kind", kind);
  form.set("name", photo.name);
  form.set("width", String(photo.width));
  form.set("height", String(photo.height));
  if (folderId) form.set("folderId", folderId);
  const res = await fetch("/api/fotos", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Falha ao enviar ${photo.name}`);
  return data as Photo;
}

export function StoreProvider({ source, children }: { source: StoreSource; children: React.ReactNode }) {
  const router = useRouter();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [studio, setStudio] = useState<StudioSettings>(defaultStudio);
  const [clientId, setClientId] = useState<string | null>(null);
  const [closed, setClosed] = useState<StoreValue["closed"]>(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);

  // Cópias sempre atuais para as ações calcularem o próximo estado antes de gravar.
  const current = useRef(galleries);
  const studioRef = useRef(studio);
  useEffect(() => {
    current.current = galleries;
    studioRef.current = studio;
  });
  const uploads = useRef(Promise.resolve());
  const studioTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const galleryId = source.mode === "cliente" ? source.galleryId : null;

  const apply = useCallback(
    (data: Loaded) => {
      if (data.ok) {
        current.current = data.galleries;
        setGalleries(data.galleries);
        setStudio(data.studio);
        setClientId(data.clientId);
        setClosed(data.closed);
      } else if (galleryId === null) {
        // Painel sem sessão válida: volta para o login.
        router.replace("/entrar");
        return;
      } else {
        setError("Não foi possível carregar a galeria. Verifique a internet e recarregue a página.");
      }
      setReady(true);
    },
    [galleryId, router],
  );

  const load = useCallback(() => fetchData(galleryId).then(apply), [galleryId, apply]);

  useEffect(() => {
    let alive = true;
    fetchData(galleryId).then((data) => alive && apply(data));
    return () => {
      alive = false;
    };
  }, [galleryId, apply]);

  // Avisa antes de fechar a página com fotos ainda sendo enviadas.
  useEffect(() => {
    if (!uploading) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  /** Grava no servidor; se falhar, avisa e recarrega o que está salvo. */
  const persist = useCallback(
    (task: () => Promise<unknown>) => {
      task().catch((err: unknown) => {
        console.error(err);
        setError("Não foi possível salvar a última alteração. Os dados foram recarregados.");
        void load();
      });
    },
    [load],
  );

  /** Atualiza a cópia local e devolve como a galeria ficou. */
  const edit = useCallback((id: string, fn: (g: Gallery) => Gallery) => {
    const before = current.current.find((g) => g.id === id);
    const after = before ? fn(before) : undefined;
    current.current = current.current.map((g) => (g.id === id && after ? after : g));
    setGalleries((list) => list.map((g) => (g.id === id ? fn(g) : g)));
    return after;
  }, []);

  const editClient = useCallback(
    (id: string, cid: string, fn: (c: GalleryClient, g: Gallery) => GalleryClient) =>
      edit(id, (g) => withDerivedStatus({ ...g, clients: g.clients.map((c) => (c.id === cid ? fn(c, g) : c)) })),
    [edit],
  );

  const addUploads = useCallback(
    (id: string, kind: PhotoKind, photos: Photo[], folderId?: string) => {
      const key = photoList[kind];
      edit(id, (g) => ({
        ...g,
        [key]: [...g[key], ...photos.map((p) => ({ ...p, folderId: kind === "selecao" ? folderId : undefined }))],
        coverPhotoId: kind === "selecao" ? (g.coverPhotoId ?? photos[0]?.id) : g.coverPhotoId,
      }));
      setUploading((n) => n + photos.length);
      // Uma foto por vez, na ordem em que foram escolhidas.
      for (const photo of photos) {
        uploads.current = uploads.current.then(async () => {
          try {
            const saved = await uploadPhoto(id, kind, photo, folderId);
            // Troca a prévia local pelo endereço no servidor (mantém a pasta, que pode ter mudado no meio).
            edit(id, (g) => ({ ...g, [key]: g[key].map((p) => (p.id === photo.id ? { ...saved, folderId: p.folderId } : p)) }));
          } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : `Falha ao enviar ${photo.name}`);
            edit(id, (g) => ({ ...g, [key]: g[key].filter((p) => p.id !== photo.id) }));
          } finally {
            setUploading((n) => n - 1);
          }
        });
      }
    },
    [edit],
  );

  const removeAnyPhoto = useCallback(
    (id: string, photoId: string) => {
      edit(id, (g) => {
        const photos = g.photos.filter((p) => p.id !== photoId);
        return {
          ...g,
          photos,
          deliveryPhotos: g.deliveryPhotos.filter((p) => p.id !== photoId),
          sameDayPhotos: g.sameDayPhotos.filter((p) => p.id !== photoId),
          coverPhotoId: g.coverPhotoId === photoId ? photos[0]?.id : g.coverPhotoId,
          favoriteIds: g.favoriteIds.filter((f) => f !== photoId),
          clients: g.clients.map((c) => withoutPhoto(c, photoId)),
        };
      });
      persist(() => painel.removePhoto(id, photoId));
    },
    [edit, persist],
  );

  const value = useMemo<StoreValue>(() => {
    const saveGallery = (id: string, fn: (g: Gallery) => Gallery, pick: (g: Gallery) => Parameters<typeof painel.updateGallery>[1]) => {
      const after = edit(id, fn);
      if (after) persist(() => painel.updateGallery(id, pick(after)));
    };

    return {
      ready,
      galleries,
      studio,
      clientId,
      closed,
      unlock: async (code) => {
        if (galleryId === null) return false;
        const ok = await cliente.unlockGallery(galleryId, code);
        if (ok) await load();
        return ok;
      },
      updateStudio: (patch) => {
        const next = { ...studioRef.current, ...patch };
        studioRef.current = next;
        setStudio(next);
        // Digitar o nome não grava a cada tecla: espera uma pausa.
        clearTimeout(studioTimer.current);
        studioTimer.current = setTimeout(() => persist(() => painel.updateStudio(studioRef.current)), 600);
      },
      getGallery: (id) => galleries.find((g) => g.id === id),
      createGallery: async (data) => {
        const gallery = await painel.createGallery(data);
        current.current = [gallery, ...current.current];
        setGalleries((list) => [gallery, ...list]);
        return gallery;
      },
      updateGallery: (id, patch) => saveGallery(id, (g) => ({ ...g, ...patch }), () => patch),
      deleteGallery: (id) => {
        setGalleries((list) => list.filter((g) => g.id !== id));
        persist(() => painel.deleteGallery(id));
      },
      renameCategory: (from, to) => {
        setGalleries((list) => list.map((g) => (g.category === from ? { ...g, category: to.trim() } : g)));
        persist(() => painel.renameCategory(from, to));
      },
      setArchived: (id, archived) => saveGallery(id, (g) => ({ ...g, archived }), () => ({ archived })),

      addPhotos: (id, photos, folderId) => addUploads(id, "selecao", photos, folderId),
      removePhoto: removeAnyPhoto,
      toggleFavorite: (id, photoId) =>
        saveGallery(
          id,
          (g) => ({
            ...g,
            favoriteIds: g.favoriteIds.includes(photoId) ? g.favoriteIds.filter((f) => f !== photoId) : [...g.favoriteIds, photoId],
          }),
          (g) => ({ favoriteIds: g.favoriteIds }),
        ),
      addFolder: (id, name) => {
        const folderId = shortId();
        saveGallery(id, (g) => ({ ...g, folders: [...g.folders, { id: folderId, name }] }), (g) => ({ folders: g.folders }));
        return folderId;
      },
      renameFolder: (id, folderId, name) =>
        saveGallery(
          id,
          (g) => ({ ...g, folders: g.folders.map((f) => (f.id === folderId ? { ...f, name } : f)) }),
          (g) => ({ folders: g.folders }),
        ),
      removeFolder: (id, folderId) => {
        edit(id, (g) => ({
          ...g,
          folders: g.folders.filter((f) => f.id !== folderId),
          // As fotos não são apagadas: só saem da pasta.
          photos: g.photos.map((p) => (p.folderId === folderId ? { ...p, folderId: undefined } : p)),
        }));
        persist(() => painel.removeFolder(id, folderId));
      },
      movePhotos: (id, photoIds, folderId) => {
        edit(id, (g) => ({ ...g, photos: g.photos.map((p) => (photoIds.includes(p.id) ? { ...p, folderId } : p)) }));
        persist(() => painel.movePhotos(id, photoIds, folderId ?? null));
      },

      addClient: (id, name, email) =>
        persist(async () => {
          const client = await painel.addClient(id, name, email);
          edit(id, (g) => withDerivedStatus({ ...g, clients: [...g.clients, client] }));
        }),
      updateClient: (id, cid, patch) => {
        editClient(id, cid, (c) => ({ ...c, ...patch }));
        persist(() => painel.updateClient(id, cid, patch));
      },
      removeClient: (id, cid) => {
        edit(id, (g) => withDerivedStatus({ ...g, clients: g.clients.filter((c) => c.id !== cid) }));
        persist(() => painel.removeClient(id, cid));
      },

      sendToClient: (id) => {
        const g = current.current.find((x) => x.id === id);
        if (!g || (g.status !== "rascunho" && g.sentAt)) return;
        edit(id, (x) => withDerivedStatus({ ...x, status: x.status === "rascunho" ? "selecao" : x.status, sentAt: x.sentAt ?? now() }));
        persist(() => painel.sendToClient(id));
      },
      toggleSelected: (id, cid, photoId) => {
        editClient(id, cid, (c, g) => toggleSelection(g, c, photoId));
        persist(() => cliente.toggleSelected(id, photoId));
      },
      setComment: (id, cid, photoId, comment) => {
        editClient(id, cid, (c) => withComment(c, photoId, comment));
        persist(() => cliente.setComment(id, photoId, comment));
      },
      toggleBw: (id, cid, photoId) => {
        editClient(id, cid, (c, g) => toggleBwRequest(g, c, photoId));
        persist(() => cliente.toggleBw(id, photoId));
      },
      finalizeSelection: (id, cid) => {
        editClient(id, cid, (c) => ({ ...c, finalizedAt: now() }));
        persist(() => cliente.finalizeSelection(id));
      },
      reopenSelection: (id, cid) => {
        editClient(id, cid, (c) => ({ ...c, finalizedAt: undefined }));
        persist(() => painel.reopenSelection(id, cid));
      },
      addDeliveryPhotos: (id, photos) => addUploads(id, "entrega", photos),
      removeDeliveryPhoto: removeAnyPhoto,
      deliver: (id) => {
        edit(id, (g) => ({ ...g, status: "entregue", deliveredAt: now() }));
        persist(() => painel.deliver(id));
      },
      addSameDayPhotos: (id, photos) => {
        // Respeita a quantidade combinada para o dia.
        const g = current.current.find((x) => x.id === id);
        const room = g ? Math.max(0, g.sameDayCount - g.sameDayPhotos.length) : 0;
        if (room) addUploads(id, "dia", photos.slice(0, room));
      },
      removeSameDayPhoto: removeAnyPhoto,
      releaseSameDay: (id) => {
        edit(id, (g) => ({ ...g, sameDayReleasedAt: g.sameDayReleasedAt ?? now() }));
        persist(() => painel.releaseSameDay(id));
      },
    };
  }, [ready, galleries, studio, clientId, closed, galleryId, load, edit, editClient, persist, addUploads, removeAnyPhoto]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {uploading > 0 && (
          <p role="status" className="rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg">
            Enviando {uploading} foto{uploading === 1 ? "" : "s"}… não feche a página
          </p>
        )}
        {error && (
          <button
            type="button"
            onClick={() => setError(null)}
            className="pointer-events-auto max-w-md rounded-2xl bg-danger px-4 py-2.5 text-left text-sm text-white shadow-lg"
          >
            {error} <span className="opacity-70">(toque para fechar)</span>
          </button>
        )}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}
