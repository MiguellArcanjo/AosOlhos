"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Contrast, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Photo } from "@/lib/types";

export function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
  protect = false,
  renderImage,
  actions,
  footer,
  onKey,
  grayscale = false,
  onGrayscale,
}: {
  photos: Photo[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  /** Bloqueia clique direito e arrastar (área do cliente). */
  protect?: boolean;
  /** Troca a imagem padrão (ex.: versão com marca d'água). */
  renderImage?: (photo: Photo, className: string) => React.ReactNode;
  actions?: (photo: Photo) => React.ReactNode;
  footer?: (photo: Photo) => React.ReactNode;
  /** Atalhos extras (ex.: espaço para selecionar). Retorne true se tratou a tecla. */
  onKey?: (e: KeyboardEvent, photo: Photo) => boolean;
  /** Mostra a foto em preto e branco (só visualização). */
  grayscale?: boolean;
  /** Quando informado, aparece o botão "P&B" para ligar/desligar. */
  onGrayscale?: (value: boolean) => void;
}) {
  const photo = photos[index];
  const touchX = useRef<number | null>(null);
  const prev = () => onIndex((index - 1 + photos.length) % photos.length);
  const next = () => onIndex((index + 1) % photos.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (photo && onKey?.(e, photo)) return e.preventDefault();
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  });

  if (!photo) return null;

  return (
    <div
      className={cn("fixed inset-0 z-50 flex flex-col bg-neutral-950/95 text-white", protect && "protected")}
      onContextMenu={protect ? (e) => e.preventDefault() : undefined}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <span className="text-sm text-white/60">
          {index + 1} / {photos.length} · {photo.name}
        </span>
        <div className="flex items-center gap-2">
          {onGrayscale && (
            <button
              type="button"
              onClick={() => onGrayscale(!grayscale)}
              aria-pressed={grayscale}
              title="Ver em preto e branco"
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 text-sm transition",
                grayscale ? "bg-white text-neutral-950" : "hover:bg-white/10",
              )}
            >
              <Contrast size={16} /> P&amp;B
            </button>
          )}
          {actions?.(photo)}
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
          touchX.current = null;
        }}
      >
        <div className={cn("relative max-h-full transition-[filter] duration-300", grayscale && "grayscale")}>
          {renderImage ? (
            renderImage(photo, "max-h-[calc(100dvh-10rem)] max-w-full object-contain")
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo.id} src={photo.src} alt={photo.name} className="max-h-[calc(100dvh-10rem)] max-w-full object-contain" />
          )}
        </div>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 sm:block"
              aria-label="Anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20 sm:block"
              aria-label="Próxima"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      <div className="min-h-16 px-4 py-3">{footer?.(photo)}</div>
    </div>
  );
}
