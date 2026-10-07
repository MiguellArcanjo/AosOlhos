"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { cn, filesToPhotos } from "@/lib/utils";
import type { Photo } from "@/lib/types";

export function Dropzone({
  onPhotos,
  label = "Arraste as fotos aqui ou clique para escolher",
  compact = false,
  maxSize,
}: {
  onPhotos: (photos: Photo[]) => void;
  label?: string;
  compact?: boolean;
  /** Maior lado da foto depois de reduzida, em pixels. */
  maxSize?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setWarning(null);
    setProgress(`Processando ${list.length} foto${list.length > 1 ? "s" : ""}…`);
    try {
      const { photos, skipped } = await filesToPhotos(list, maxSize);
      if (photos.length) onPhotos(photos);
      if (skipped.length) {
        const names = skipped.slice(0, 3).map((s) => s.name).join(", ") + (skipped.length > 3 ? ` e mais ${skipped.length - 3}` : "");
        const raw = skipped.some((s) => s.raw);
        setWarning(
          `${skipped.length} arquivo${skipped.length > 1 ? "s ficaram" : " ficou"} de fora (${names}). ` +
            (raw
              ? "Arquivos RAW não abrem no navegador: exporte em JPEG no Lightroom e envie de novo."
              : "Este navegador não abre esse formato: envie em JPEG ou PNG."),
        );
      }
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={!!progress}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm text-muted transition",
          compact ? "py-6" : "py-14",
          dragging ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent",
        )}
      >
        <UploadCloud size={compact ? 22 : 32} className="text-accent" />
        <span>{progress ?? label}</span>
        {!compact && !progress && <span className="text-xs">JPG ou PNG · várias de uma vez · RAW: exporte em JPEG antes</span>}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handle(e.target.files)} />
      </button>
      {warning && (
        <p className="flex items-start justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{warning}</span>
          <button type="button" onClick={() => setWarning(null)} aria-label="Fechar aviso" className="shrink-0 opacity-60 hover:opacity-100">
            <X size={16} />
          </button>
        </p>
      )}
    </div>
  );
}
