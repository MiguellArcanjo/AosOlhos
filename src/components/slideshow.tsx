"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize, Pause, Play, X } from "lucide-react";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

const INTERVAL = 4500;

/** Apresentação em tela cheia com troca automática e transição suave. */
export function Slideshow({ photos, onClose, title }: { photos: Photo[]; onClose: () => void; title?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(next, INTERVAL);
    return () => clearTimeout(t);
  }, [playing, index, next]);

  // Pré-carrega a próxima foto para a transição não piscar.
  useEffect(() => {
    const img = new Image();
    img.src = photos[(index + 1) % photos.length]?.src ?? "";
  }, [index, photos]);

  const wake = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2500);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      wake();
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    idleTimer.current = setTimeout(() => setIdle(true), 2500);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(idleTimer.current);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [next, prev, onClose, wake]);

  return (
    <div
      ref={root}
      className={cn("fixed inset-0 z-50 bg-black text-white", idle && "cursor-none")}
      onMouseMove={wake}
      onTouchStart={wake}
    >
      {photos.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.id}
          src={Math.abs(i - index) <= 1 || (index === photos.length - 1 && i === 0) ? p.src : undefined}
          alt={p.name}
          className={cn(
            "absolute inset-0 h-full w-full object-contain transition-all duration-[1400ms] ease-out",
            i === index ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
          )}
        />
      ))}

      <div className={cn("absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4 transition-opacity", idle && "opacity-0")}>
        <span className="font-serif text-xl">{title}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setPlaying((p) => !p)} className="rounded-full p-2 hover:bg-white/10" aria-label={playing ? "Pausar" : "Continuar"}>
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            type="button"
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen())?.catch(() => {})}
            className="rounded-full p-2 hover:bg-white/10"
            aria-label="Tela cheia"
          >
            <Maximize size={20} />
          </button>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>
      </div>

      <button type="button" onClick={prev} className="absolute inset-y-0 left-0 w-1/4" aria-label="Anterior">
        <ChevronLeft size={32} className={cn("ml-4 transition-opacity", idle ? "opacity-0" : "opacity-70")} />
      </button>
      <button type="button" onClick={next} className="absolute inset-y-0 right-0 flex w-1/4 items-center justify-end" aria-label="Próxima">
        <ChevronRight size={32} className={cn("mr-4 transition-opacity", idle ? "opacity-0" : "opacity-70")} />
      </button>

      <div className={cn("absolute inset-x-0 bottom-0 h-1 bg-white/10 transition-opacity", idle && "opacity-0")}>
        <div className="h-full bg-white/70 transition-all duration-500" style={{ width: `${((index + 1) / photos.length) * 100}%` }} />
      </div>
    </div>
  );
}
