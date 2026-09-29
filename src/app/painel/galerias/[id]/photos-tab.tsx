"use client";

import { useDialog } from "@/components/dialog";
import { useState } from "react";
import { CheckSquare, FolderInput, FolderPlus, ImageIcon, Pencil, Star, Trash2, X } from "lucide-react";
import { Dropzone } from "@/components/dropzone";
import { Lightbox } from "@/components/lightbox";
import { Button, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Gallery } from "@/lib/types";
import { cn, photosInFolder } from "@/lib/utils";

/** null = todas as fotos; "" = sem pasta; qualquer outro valor = id da pasta. */
type FolderFilter = string | null;

export function PhotosTab({ gallery }: { gallery: Gallery }) {
  const { addPhotos, removePhoto, toggleFavorite, updateGallery, addFolder, renameFolder, removeFolder, movePhotos } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const [folder, setFolder] = useState<FolderFilter>(null);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const locked = gallery.status === "finalizada" || gallery.status === "entregue";
  const [dialog, dialogElement] = useDialog();

  const currentFolder = gallery.folders.find((f) => f.id === folder);
  const visible = photosInFolder(gallery.photos, folder);
  const unfiled = gallery.photos.filter((p) => !p.folderId).length;

  async function newFolder() {
    const name = await dialog.prompt({ title: "Nova pasta", label: "Nome", placeholder: "Ex.: Cerimônia", confirmLabel: "Criar" });
    if (name) setFolder(addFolder(gallery.id, name));
  }

  function stopSelecting() {
    setSelecting(false);
    setPicked([]);
  }

  function move(folderId: string) {
    movePhotos(gallery.id, picked, folderId || undefined);
    stopSelecting();
  }

  return (
    <div className="space-y-5">
      {dialogElement}
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={folder === null} onClick={() => setFolder(null)}>
          Todas <Count>{gallery.photos.length}</Count>
        </Chip>
        {gallery.folders.map((f) => (
          <Chip key={f.id} active={folder === f.id} onClick={() => setFolder(f.id)}>
            {f.name} <Count>{gallery.photos.filter((p) => p.folderId === f.id).length}</Count>
          </Chip>
        ))}
        {gallery.folders.length > 0 && unfiled > 0 && (
          <Chip active={folder === ""} onClick={() => setFolder("")}>
            Sem pasta <Count>{unfiled}</Count>
          </Chip>
        )}
        <button type="button" onClick={newFolder} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-accent-strong hover:bg-accent-soft">
          <FolderPlus size={15} /> Nova pasta
        </button>
      </div>

      {currentFolder && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>
            Pasta <strong className="text-foreground">{currentFolder.name}</strong>
          </span>
          <button
            type="button"
            title="Renomear"
            className="rounded-full p-1.5 hover:bg-accent-soft"
            onClick={async () => {
              const name = await dialog.prompt({ title: "Renomear pasta", label: "Nome", initial: currentFolder.name });
              if (name) renameFolder(gallery.id, currentFolder.id, name);
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            title="Excluir pasta (as fotos continuam na galeria)"
            className="rounded-full p-1.5 hover:bg-accent-soft"
            onClick={async () => {
              const ok = await dialog.confirm({
                title: `Excluir a pasta "${currentFolder.name}"?`,
                message: "As fotos continuam na galeria, só ficam sem pasta.",
                confirmLabel: "Excluir pasta",
                danger: true,
              });
              if (ok) {
                removeFolder(gallery.id, currentFolder.id);
                setFolder(null);
              }
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {!locked && (
        <Dropzone
          onPhotos={(photos) => addPhotos(gallery.id, photos, folder || undefined)}
          compact={gallery.photos.length > 0}
          label={currentFolder ? `Arraste as fotos para a pasta "${currentFolder.name}"` : undefined}
        />
      )}

      {visible.length > 0 && (
        <>
          <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 text-sm text-muted">
            {selecting ? (
              <>
                <span>
                  <strong className="text-foreground">{picked.length}</strong> selecionada{picked.length === 1 ? "" : "s"} ·{" "}
                  <button type="button" className="underline" onClick={() => setPicked(visible.map((p) => p.id))}>
                    marcar todas
                  </button>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2">
                    <FolderInput size={16} />
                    <select
                      className={cn(inputClass, "w-auto py-1.5")}
                      disabled={picked.length === 0}
                      value="-"
                      onChange={(e) => move(e.target.value)}
                    >
                      <option value="-" disabled>
                        Mover para…
                      </option>
                      {gallery.folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                      <option value="">Sem pasta</option>
                    </select>
                  </label>
                  <Button variant="ghost" className="px-3 py-1.5" onClick={stopSelecting}>
                    <X size={16} /> Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <span>
                  {visible.length} fotos · {gallery.favoriteIds.length} favoritas suas
                </span>
                {gallery.folders.length > 0 && (
                  <Button variant="ghost" className="px-3 py-1.5" onClick={() => setSelecting(true)}>
                    <CheckSquare size={16} /> Organizar em pastas
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {visible.map((p, i) => {
              const fav = gallery.favoriteIds.includes(p.id);
              const cover = gallery.coverPhotoId === p.id;
              const isPicked = picked.includes(p.id);
              const folderName = folder === null ? gallery.folders.find((f) => f.id === p.folderId)?.name : undefined;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl bg-accent-soft",
                    isPicked && "ring-4 ring-accent ring-offset-2 ring-offset-background",
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      selecting ? setPicked((list) => (isPicked ? list.filter((x) => x !== p.id) : [...list, p.id])) : setOpen(i)
                    }
                    className="h-full w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={p.name} loading="lazy" className={cn("h-full w-full object-cover", selecting && !isPicked && "opacity-70")} />
                  </button>
                  <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
                    {cover && <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">Capa</span>}
                    {folderName && <span className="rounded-full bg-white/85 px-2 py-0.5 text-[11px]">{folderName}</span>}
                  </div>
                  {!selecting && (
                    <>
                      <div className="absolute right-2 top-2 flex gap-1">
                        <IconAction
                          label={fav ? "Remover das favoritas" : "Marcar como favorita"}
                          onClick={() => toggleFavorite(gallery.id, p.id)}
                          active={fav}
                        >
                          <Star size={15} className={fav ? "fill-amber-400 text-amber-400" : ""} />
                        </IconAction>
                      </div>
                      <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-0 transition group-hover:opacity-100">
                        <IconAction label="Usar como capa" onClick={() => updateGallery(gallery.id, { coverPhotoId: p.id })}>
                          <ImageIcon size={15} />
                        </IconAction>
                        {!locked && (
                          <IconAction label="Remover foto" onClick={async () =>
                              (await dialog.confirm({ title: `Remover ${p.name}?`, confirmLabel: "Remover", danger: true })) &&
                              removePhoto(gallery.id, p.id)
                            }>
                            <Trash2 size={15} />
                          </IconAction>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {visible.length === 0 && gallery.photos.length > 0 && (
        <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">Nenhuma foto nesta pasta ainda.</p>
      )}

      {open !== null && (
        <Lightbox
          photos={visible}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          actions={(p) => (
            <button
              type="button"
              onClick={() => toggleFavorite(gallery.id, p.id)}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-white/10"
            >
              <Star size={18} className={gallery.favoriteIds.includes(p.id) ? "fill-amber-400 text-amber-400" : ""} />
              Favorita
            </button>
          )}
        />
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition",
        active ? "bg-foreground text-white" : "border border-line bg-surface hover:bg-accent-soft",
      )}
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-xs opacity-60">{children}</span>;
}

function IconAction({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded-full p-1.5 shadow transition",
        active ? "bg-white text-foreground" : "bg-white/85 text-foreground hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
