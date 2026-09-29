"use client";

import { useState } from "react";
import { ImageIcon, Star, Trash2 } from "lucide-react";
import { Dropzone } from "@/components/dropzone";
import { Lightbox } from "@/components/lightbox";
import { useStore } from "@/lib/store";
import type { Gallery } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PhotosTab({ gallery }: { gallery: Gallery }) {
  const { addPhotos, removePhoto, toggleFavorite, updateGallery } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const locked = gallery.status === "finalizada" || gallery.status === "entregue";

  return (
    <div className="space-y-6">
      {!locked && <Dropzone onPhotos={(photos) => addPhotos(gallery.id, photos)} compact={gallery.photos.length > 0} />}

      {gallery.photos.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <span>
              {gallery.photos.length} fotos · {gallery.favoriteIds.length} favoritas suas
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" /> favoritas aparecem em destaque para o cliente
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {gallery.photos.map((p, i) => {
              const fav = gallery.favoriteIds.includes(p.id);
              const cover = gallery.coverPhotoId === p.id;
              return (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-accent-soft">
                  <button type="button" onClick={() => setOpen(i)} className="h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  </button>
                  {cover && (
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">Capa</span>
                  )}
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
                      <IconAction
                        label="Remover foto"
                        onClick={() => confirm(`Remover ${p.name}?`) && removePhoto(gallery.id, p.id)}
                      >
                        <Trash2 size={15} />
                      </IconAction>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {open !== null && (
        <Lightbox
          photos={gallery.photos}
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
