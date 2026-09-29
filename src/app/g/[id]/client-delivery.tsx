"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button, Logo } from "@/components/ui";
import { Lightbox } from "@/components/lightbox";
import { JustifiedGrid } from "@/components/justified-grid";
import type { Gallery, Photo } from "@/lib/types";
import { coverOf, formatDate } from "@/lib/utils";

async function photoBlob(p: Photo) {
  const res = await fetch(p.src);
  if (!res.ok) throw new Error(`Falha ao baixar ${p.name}`);
  return res.blob();
}

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function ClientDelivery({ gallery }: { gallery: Gallery }) {
  const [open, setOpen] = useState<number | null>(null);
  const [zipping, setZipping] = useState<string | null>(null);
  const photos = gallery.deliveryPhotos;
  const cover = coverOf(gallery);

  async function downloadOne(p: Photo) {
    try {
      saveBlob(await photoBlob(p), p.name);
    } catch {
      window.open(p.src, "_blank");
    }
  }

  async function downloadAll() {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    try {
      for (const [i, p] of photos.entries()) {
        setZipping(`Preparando ${i + 1} de ${photos.length}…`);
        zip.file(p.name, await photoBlob(p));
      }
      setZipping("Compactando…");
      saveBlob(await zip.generateAsync({ type: "blob" }), `${gallery.clientName} - Aos Olhos.zip`);
    } catch {
      alert("Não foi possível baixar todas as fotos. Tente novamente.");
    } finally {
      setZipping(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex h-[60vh] min-h-80 items-end overflow-hidden">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(photos[0] ?? cover).src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 text-white sm:px-6">
          <Logo className="text-sm text-white/70" />
          <h1 className="mt-2 font-serif text-5xl leading-tight">{gallery.clientName}</h1>
          <p className="mt-1 text-white/80">
            {gallery.title} · {formatDate(gallery.eventDate)}
          </p>
          <Button onClick={downloadAll} disabled={!!zipping || photos.length === 0} variant="secondary" className="mt-6 border-transparent">
            <Download size={16} /> {zipping ?? `Baixar todas (${photos.length})`}
          </Button>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-2 py-6 sm:px-6">
        <JustifiedGrid photos={photos}>
          {(p, i) => (
            <div className="group h-full">
              <button type="button" onClick={() => setOpen(i)} className="block h-full w-full overflow-hidden rounded-lg bg-accent-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => downloadOne(p)}
                aria-label={`Baixar ${p.name}`}
                className="absolute bottom-2 right-2 rounded-full bg-white/90 p-2.5 shadow-lg transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Download size={16} />
              </button>
            </div>
          )}
        </JustifiedGrid>
      </main>

      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          actions={(p) => (
            <button
              type="button"
              onClick={() => downloadOne(p)}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              <Download size={16} /> Baixar
            </button>
          )}
        />
      )}
    </div>
  );
}
