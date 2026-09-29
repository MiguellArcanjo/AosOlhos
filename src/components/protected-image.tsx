"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { watermarked } from "@/lib/watermark";

/**
 * Mostra a foto com a marca d'água gravada nos pixels.
 * Enquanto gera, mostra um fundo neutro — a versão sem marca nunca é exibida.
 */
export function ProtectedImage({
  photo,
  enabled,
  className,
  loading,
}: {
  photo: Photo;
  enabled: boolean;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const { studio } = useStore();
  const [result, setResult] = useState<{ key: string; url: string | null } | null>(null);
  const key = `${photo.id}|${enabled}`;

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    watermarked(photo.id, photo.src, studio)
      .then((url) => alive && setResult({ key, url }))
      .catch(() => alive && setResult({ key, url: null }));
    return () => {
      alive = false;
    };
  }, [enabled, photo.id, photo.src, studio, key]);

  if (!enabled) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo.src} alt={photo.name} loading={loading} className={className} draggable={false} />;
  }

  const url = result?.key === key ? result.url : undefined;
  if (url === undefined) return <div className={cn(className, "animate-pulse bg-accent-soft")} />;
  if (url === null) {
    // Não deu para gravar (imagem sem permissão de leitura): cai para a marca visual por cima.
    return (
      <div className={cn("watermark relative", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.name} loading={loading} className="h-full w-full object-cover" draggable={false} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={photo.name} loading={loading} className={className} draggable={false} />;
}
