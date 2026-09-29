"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn, filesToPhotos } from "@/lib/utils";
import type { Photo } from "@/lib/types";

export function Dropzone({
  onPhotos,
  label = "Arraste as fotos aqui ou clique para escolher",
  compact = false,
}: {
  onPhotos: (photos: Photo[]) => void;
  label?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setProgress(`Processando ${list.length} foto${list.length > 1 ? "s" : ""}…`);
    try {
      onPhotos(await filesToPhotos(list));
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
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
      {!compact && !progress && <span className="text-xs">JPG ou PNG · várias de uma vez</span>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handle(e.target.files)}
      />
    </button>
  );
}
